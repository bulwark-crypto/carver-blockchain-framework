const EventEmitter = require('events');

import { Context, State } from './interfaces/context'
import { RegisteredContext } from './contextDispatcher'
import { Event } from './interfaces/events'
import { bindContextDispatcher } from './contextDispatcher'

//@todo this should be a global permanent store (so store can be non-mongodb)
import { createPermanentStore } from '../classes/adapters/mongodb/permanentStore'

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

const createContextStore = ({ id, parent }: CreateContextStoreOptions): ContextStore => {
    const registeredContexts: RegisteredContext[] = [];

    const register = async <EventType, TypeOfEventType>({ id, context }: RegisterContextParams, options: any = { /*This could contain event storing options*/ }) => {

        const initialState = {
            ...context.initialState
        }
        const stateStore = {
            state: initialState.isStateChain ? initialState.state : initialState
        }
        const permanentStore = createPermanentStore({ id });

        // Event emitter is shared between events and registered context. That way we can handle requests outside of event store
        const emitter = new EventEmitter();
        const eventStore = bindContextDispatcher({ emitter, context, stateStore, permanentStore });


        // Forward requests from emitted state to async request handler
        const subscribeToRequest = (type: string, callback: (event: Event) => Promise<any>): void => {
            emitter.on(type, async (event: Event) => {
                try {
                    const response = await callback(event.payload);
                    eventStore.dispatch({
                        type: event.type,
                        payload: { response }
                    })
                } catch (error) {
                    eventStore.dispatch({
                        type: event.type,
                        payload: { error }
                    })
                    console.log('error', error);
                }

            });
        }
        //@todo it would be great to ensure that the passed-in context .errors are all unique to avoid unexpected errors

        const registeredContext = {
            id,
            context,
            eventStore,
            subscribeToRequest,
            stateStore,
            permanentStore
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