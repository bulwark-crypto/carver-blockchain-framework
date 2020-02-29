const EventEmitter = require('events');

import { Context } from '../interfaces/context'
import { Event } from '../interfaces/events'
import { createEventStore } from '../eventStore'
import { bindContextDispatcher } from './contextDispatcher'

//@todo this should be a global permanent store (so store can be non-mongodb)
import { StateStore } from '../interfaces/stateStore';
import { ReplayEventsParams } from '../interfaces/eventStore';

export interface RegisterContextParams {
    context: any;
    /**
     * If set to true events eimtted in Reducer will not be stored in database.
     */
    storeEvents?: boolean;
    id: string;
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

    /**
     *@todo Exposing state store to other contexts is dangerous. Think of a way to prevent other contexts from accessing state directly. (You should access context state via queries ONLY) 
     * Currently we're only exposing state store to get it in the same context in bindings.ts
     */
    stateStore: StateStore;
    //eventStore: EventStore; // Notice that you can't access event store directly. (use streamEvents instead)
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

    const dispatchQueue = [] as any[];
    let startedDispatching = false;

    //@todo look into async.queue for this exact pattern
    const dispatchNext = async (event: Event) => {

        if (startedDispatching) {
            dispatchQueue.push(event);
            return;
        }
        startedDispatching = true;
        try {

            // Note that his can throw (Notice that state chain is built into expected emit state return)
            const reducerResults = context.reducer({ state: stateStore.state, event }) as any;

            // Notice that we store the new reducer after emitting the side effects
            const state = reducerResults.isStateChain ? reducerResults.state : reducerResults;

            const { store, emit, query, ...stateWithoutSideEffects } = state;

            // Save to permanent store / event store
            //@todo add db transaction for this storing to ensure they both have guranteed saving
            await contextDispatcher.saveToPermanentStore(store);
            await contextDispatcher.saveToEventStore(emit);

            // After successful save of both permanent/event store update the state
            stateStore.state = stateWithoutSideEffects;
            startedDispatching = false;

            // After saving / changing state emit events & queries
            await contextDispatcher.emitEvents(emit);

            //@todo this might be a good place to add timer. Dispatch an event with stats of how many queries were ran & how long they it took them to execute (For analytics and performance tuning)
            const response = await contextDispatcher.emitQueries(query);

            // Utilize the queue if there are no additional queries to emit
            if (!response) {
                if (dispatchQueue.length > 0) {
                    return dispatchQueue.shift();
                }
            }

            // If response is returned that means there are is a pending query. It'll be dispatch()'ed again to the context
            return response
        } catch (err) {
            console.log(`${id} exception:`);
            console.log(err);
            throw err
        }

    }



    const dispatch = async (event: Event) => {
        // Keep dispatching until there is no futher response from the context
        while (true) {
            event = await dispatchNext(event)
            if (!event) {
                break;
            }
        }

    }

    const query = async (query: string, payload: any) => {
        if (!storeHandlers.has(query)) {
            throw commonLanguage.errors.UnhandledQuery;
        }

        const subscription = storeHandlers.get(query);
        return await subscription(payload);
    }

    const streamEvents = async (params: ReplayEventsParams) => {
        eventStore.streamEvents(params);
    }
    const disconnect = async () => {
        eventStore.unbindAllListeners();
    }

    const registeredContext = {
        id,

        context,
        dispatch,

        stateStore,
        //eventStore,

        handleQuery,
        handleStore,
        query,
        streamEvents,
        disconnect

    } as RegisteredContext

    return registeredContext;
};

const commonLanguage = {
    errors: {
        UnhandledQuery: 'UNHANDLED_QUERY',
        QueryAlreadyRegistered: 'QUERY_ALREADY_REGISTERED',
        StoreAlreadyRegistered: 'STORE_ALREADY_REGISTERED',

        GetNotSupportedByIpc: 'ContextStore.getById() is not supported by ipc contexts. Please use contextStore.getById() instead.'
    }
}

export {
    createRegisteredContext
}