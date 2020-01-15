const EventEmitter = require('events');

import { Context, State } from './interfaces/context'
import { Event } from './interfaces/events'
import { PermanentStore } from './interfaces/permanentStore';
import { createEventStore } from './eventStore'
import { bindContextDispatcher } from './contextDispatcher'

//@todo this should be a global permanent store (so store can be non-mongodb)
import { StateStore } from './interfaces/stateStore';
import { EventStore } from './interfaces/eventStore';

interface RegisterContextParams {
    context: any;
    id: string;
}
interface CreateContextStoreOptions {
    id: string;
    version?: number;
    parent?: any;
}
interface ContextStore {
    id: string;
    parent?: ContextStore;
    register: <EventType, TypeOfEventType>({ id, context }: RegisterContextParams, options?: any) => Promise<RegisteredContext>;
    get: (context: any, id?: string) => Promise<RegisteredContext>;
    getParent: (id: string) => ContextStore;
}
export interface RegisteredContext {
    context: Context;
    id: string;
    version: number;
    reduce: (event: Event) => void;
    /**
     * - Reduce an event
     * - Store objects in permanent store
     * - Store new events in event store
     */
    dispatch: (event: Event) => Promise<void>;
    handleQuery: (type: string, callback: (event: Event) => Promise<any>) => void;
    handleStore: (type: string, callback: (payload: any) => Promise<any>) => void;
    query: (query: string, payload: any) => Promise<any>;

    stateStore: StateStore;
    eventStore: EventStore;
}

const createContextStore = ({ id, parent }: CreateContextStoreOptions): ContextStore => {
    const registeredContexts: RegisteredContext[] = [];

    const register = async <EventType, TypeOfEventType>({ id, context }: RegisterContextParams, options: any = { /*This could contain event storing options*/ }) => {

        //@todo during registration process ensure the commonLanguage of context does not contain any duplicate strings

        const initialState = {
            ...context.initialState
        }
        const stateStore = {
            state: initialState.isStateChain ? initialState.state : initialState
        }
        // Event emitter is shared between events and registered context. That way we can handle requests outside of event store
        const emitter = new EventEmitter();

        const eventStore = await createEventStore({ emitter, id });

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

        let startedDispatching = false;
        const dispatchNext = async (event: Event) => {
            if (startedDispatching) {
                console.log(event);
                throw `You can only dispatch ${id} one at a time`;
            }
            startedDispatching = true;
            try {

                // Note that his can throw (Notice that state chain is built into expected emit state return)
                const reducerResults = context.reducer({ state: stateStore.state, event }) as any;

                // Notice that we store the new reducer after emitting the side effects
                const state = reducerResults.isStateChain ? reducerResults.state : reducerResults;

                const { store, emit, request, ...stateWithoutSideEffects } = state;

                // Save to permanent store / event store
                await contextDispatcher.saveToPermanentStore(store);
                await contextDispatcher.saveToEventStore(emit);

                // After successful save of both permanent/event store update the state
                stateStore.state = stateWithoutSideEffects;
                startedDispatching = false;

                // After saving / changing state emit events & queries
                await contextDispatcher.emitEvents(emit);

                const response = await contextDispatcher.emitQueries(request);
                // If response is returned that means there are is a pending query. It'll be dispatch()'ed again to the context
                return response
            } catch (err) {
                console.log(`${id} exception:`);
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

        const registeredContext = {
            id,

            context,
            dispatch,

            stateStore,
            eventStore,

            handleQuery,
            handleStore,
            query
        } as RegisteredContext
        registeredContexts.push(registeredContext);

        return registeredContext;
    };

    const get = async <EventType, TypeOfEventType>(context: Context, id: string = null) => {
        return registeredContexts.find(registeredContext => registeredContext.context === context && (!!id ? registeredContext.id === id : true));
    };

    const getParent = (id: string) => {
        let context = parent;

        while (true) {
            if (!context) {
                return null;
            }

            if (context.id === id) {
                return context;
            }

            context = context.parent;
        }
    }


    return {
        id,
        parent,
        register,
        get,
        getParent
    };
}

const commonLanguage = {
    errors: {
        UnhandledQuery: 'UNHANDLED_QUERY',
        QueryAlreadyRegistered: 'QUERY_ALREADY_REGISTERED',
        StoreAlreadyRegistered: 'STORE_ALREADY_REGISTERED'
    }
}

export {
    createContextStore,
    ContextStore
}