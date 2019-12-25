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
    dispatch: (event: Event) => Promise<void>;
    subscribeToRequest: (type: string, callback: (event: Event) => Promise<any>) => void;
    subscribeToStore: (type: string, callback: (payload: any) => Promise<any>) => void;

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

        const eventStore = createEventStore({ emitter, id });

        //@todo the binding of context dispatcher needs to be moved down (subscrieToRequest,dispatch() should not be here)


        const storeSubscriptions = new Map<string, ((payload: any) => Promise<any>)[]>();

        const contextDispatcher = bindContextDispatcher({ emitter, context, stateStore, storeSubscriptions, eventStore });

        // Forward requests from emitted state to async request handler
        const subscribeToRequest = (type: string, callback: (event: Event) => Promise<any>): void => {
            emitter.on(type, async (event: Event) => {
                try {
                    const response = await callback(event.payload);
                    contextDispatcher.dispatch({
                        type: event.type,
                        payload: { response }
                    })
                } catch (error) {
                    contextDispatcher.dispatch({
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


        const dispatch = async (event: Event) => {
            await contextDispatcher.dispatch(event);
        }

        const registeredContext = {
            id,

            context,
            dispatch,

            stateStore,
            eventStore,

            subscribeToRequest,
            subscribeToStore,
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