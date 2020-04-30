import { EventEmitter } from 'events'

import { Context } from '../interfaces/context'
import { Event } from '../interfaces/events'
import { createEventStore } from '../eventStore'
import { bindContextDispatcher } from './contextDispatcher'

import { ReplayEventsParams } from '../interfaces/eventStore';
import { dbStore } from '../adapters/mongodb/mongoDbInstance'
import * as async from 'async';
import { ClientSession } from 'mongodb'

export interface RegisterContextParams {
    context: any;
    /**
     * If set to true events eimtted in Reducer will not be stored in database.
     */
    storeEvents?: boolean;
    /**
     * If set to true the context will not be registered on RabbitMQ and can only be accessed via getLocal() in ContextStore
     */
    inMemory?: boolean;
    id?: string;
}

export interface RegisteredContext {
    context: Context;

    id: string;
    /**
     * - Reduce an event
     * - Store objects in permanent store
     * - Store new events in event store
     */
    dispatch: (event: Event) => Promise<void>;
    handleQuery: (type: string, callback: (event: Event) => Promise<any>) => void;
    handleStore: (type: string, callback: (payload: any) => Promise<any>) => void;
    query: (query: string, payload?: any) => Promise<any>;

    disconnect: () => Promise<void>;
    streamEvents: (params: ReplayEventsParams) => Promise<void>;

}

const createRegisteredContext = async ({ id, storeEvents, context }: RegisterContextParams) => {
    //@todo during registration process ensure the commonLanguage of context does not contain any duplicate strings

    const initialState = {
        ...context.initialState
    }
    const stateStore = {
        state: initialState.isStateChain ? initialState.state : initialState
    }
    // Event emitter is shared between events and registered context. That way we can handle requests outside of event store
    const emitter = new EventEmitter();

    const eventStore = await createEventStore({ emitter, id, storeEvents });

    //@todo the binding of context dispatcher needs to be moved down (subscrieToRequest,dispatch() should not be here)

    const storeHandlers = new Map<string, ((payload: any) => Promise<any>)>();
    const queryHandlers = new Map<string, ((payload: any) => Promise<any>)>();

    const contextDispatcher = bindContextDispatcher({ emitter, storeHandlers, queryHandlers, eventStore });

    // Forward requests from emitted state to async request handler
    const handleQuery = (type: string, callback: (event: Event) => Promise<any>): void => {
        if (queryHandlers.has(type)) {
            throw commonLanguage.errors.QueryAlreadyRegistered
        }

        queryHandlers.set(type, callback)
    }

    const handleStore = (type: string, callback: (payload: any) => Promise<any>): void => {
        if (storeHandlers.has(type)) {
            throw commonLanguage.errors.StoreAlreadyRegistered
        }

        storeHandlers.set(type, callback)
    }


    // If something needs to get stored to permanent store or events need to be stored in 
    let session: ClientSession = null;

    const dispatchQueue = async.queue(async (event: Event, callback) => {

        try {
            // Note that his can throw (Notice that state chain is built into expected emit state return)
            const reducerResults = context.reducer({ state: stateStore.state, event }) as any;

            // Notice that we store the new reducer after emitting the side effects
            const state = reducerResults.isStateChain ? reducerResults.state : reducerResults;

            const { store, emit, query, ...stateWithoutSideEffects } = state;

            // Save to permanent store / event store
            if (store || emit && storeEvents) {
                // Only start transaction if there is something to store/emit
                if (!session) {
                    const client = dbStore.getClient();
                    session = client.startSession();
                }

                session.startTransaction();
            }
            await contextDispatcher.saveToPermanentStore(store);
            await contextDispatcher.saveToEventStore(emit);
            if (store || emit && storeEvents) {
                session.commitTransaction();
            }

            // After successful save of both permanent/event store update the state
            stateStore.state = stateWithoutSideEffects;

            // After saving / changing state emit events & queries
            await contextDispatcher.emitEvents(emit);

            // You should not be doing two queries at once on a side effect. Instead name your query REMOVE_AND_INSERT vs two queries.
            // This simplifies concurrency on queries.
            if (query) {
                if (query.length > 1) {
                    throw commonLanguage.errors.MultiplieQueriesDetected;
                }

                //@todo this might be a good place to add timer. Dispatch an event with stats of how many queries were ran & how long they it took them to execute (For analytics and performance tuning)
                const response = await contextDispatcher.query(query[0]);

                if (!!response) {
                    // If there is a query that this context wants to execute a query, prepend it (so it's next to be executed). This allows chaining of query->response->query
                    dispatchQueue.unshift(response);
                }
            }

        } catch (err) {
            console.log(`${id} exception:`);
            console.log(err);
            throw err
        }

        callback();
    });

    const dispatch = async (event: Event) => {
        dispatchQueue.push(event);
    }

    const query = async (query: string, payload: any) => {
        if (!storeHandlers.has(query)) {
            throw commonLanguage.errors.UnhandledQuery;
        }

        const subscription = storeHandlers.get(query);
        const response = await subscription(payload);

        return response !== undefined ? response : null;// Do not return undefined query, always return null or object
    }

    const streamEvents = async (params: ReplayEventsParams) => {
        eventStore.streamEvents(params);
    }

    const disconnect = async () => {
        //dispatchQueue.
        await eventStore.unbindAllListeners();
        emitter.removeAllListeners();

        if (session) {
            session.endSession();
        }
    }

    const registeredContext = {
        id,

        context,
        dispatch,

        handleQuery,
        handleStore,
        query,
        streamEvents,
        disconnect
    } as RegisteredContext

    return {
        registeredContext,
        stateStore
    }
};

const commonLanguage = {
    errors: {
        UnhandledQuery: 'UNHANDLED_QUERY',
        QueryAlreadyRegistered: 'QUERY_ALREADY_REGISTERED',
        StoreAlreadyRegistered: 'STORE_ALREADY_REGISTERED',

        MultiplieQueriesDetected: 'MULTIPLE_QUERIES_DETECTED'
    }
}

export {
    createRegisteredContext
}