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
    subscribeToRequest: (type: string, callback: (event: Event) => Promise<any>) => void;
    subscribeToStore: (type: string, callback: (payload: any) => Promise<any>) => void;
    query: (query: string, payload: any) => Promise<any>;

    stateStore: StateStore;
    eventStore: EventStore;
}

const createContextStore = ({ id, parent }: CreateContextStoreOptions): ContextStore => {
    const registeredContexts: RegisteredContext[] = [];

    const register = async <EventType, TypeOfEventType>({ id, context }: RegisterContextParams, options: any = { /*This could contain event storing options*/ }) => {

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


        const storeSubscriptions = new Map<string, ((payload: any) => Promise<any>)[]>(); // @todo should NOT be an array or a query can only be handled by a single callback?

        const contextDispatcher = bindContextDispatcher({ emitter, storeSubscriptions, eventStore });

        // Forward requests from emitted state to async request handler
        const subscribeToRequest = (type: string, callback: (event: Event) => Promise<any>): void => {
            emitter.on(type, async (event: Event) => {
                try {
                    const response = await callback(event.payload);
                    dispatch({
                        type: event.type,
                        payload: { response }
                    })
                } catch (error) {
                    dispatch({
                        type: event.type,
                        payload: { error }
                    })
                    console.log('error', error);
                }

            });
        }


        const subscribeToStore = (type: string, callback: (payload: any) => Promise<any>): void => {
            if (!storeSubscriptions.has(type)) {
                storeSubscriptions.set(type, []);
            }

            storeSubscriptions.get(type).push(callback)
        }


        let startedDispatching = false;
        const dispatch = async (event: Event) => {
            if (startedDispatching) {
                throw `You can only dispatch ${id} one at a time`;
            }
            startedDispatching = true;
            console.log('[START]', id, event.type, stateStore.state.height);
            try {
                // Note that his can throw (Notice that state chain is built into expected emit state return)
                const reducerResults = context.reducer({ state: stateStore.state, event }) as any;

                // Notice that we store the new reducer after emitting the side effects
                const state = reducerResults.isStateChain ? reducerResults.state : reducerResults;

                //console.log('storing...', id);

                // Store the new state before emitting events/queries (as those might alter state further)
                stateStore.state = await contextDispatcher.storeState(state);
                console.log('[STORED] ', id, state.height, stateStore.state.height);

                // Replace state with reducer results if there are no exceptions in storing events
                await contextDispatcher.emitEventsAndQueries(state);
            } catch (err) {
                console.log(`${id} exception:`);
                throw err
            }
            console.log('[END]', id, event.type, stateStore.state.height);

            startedDispatching = false;
        }

        const query = async (query: string, payload: any) => {

            if (!storeSubscriptions.has(query)) {
                console.log(`Unhandled store query: ${query} (context id: ${id})`)
                return;
            }

            const subscriptions = storeSubscriptions.get(query);
            for await (const subscription of subscriptions) {
                return await subscription(payload);
            }
        }

        const registeredContext = {
            id,

            context,
            dispatch,

            stateStore,
            eventStore,

            subscribeToRequest,
            subscribeToStore,
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

export {
    createContextStore,
    ContextStore
}