const EventEmitter = require('events');

import { Context, State } from './interfaces/context'
import { RegisteredContext } from './eventStore'
import { Event } from './interfaces/events'
import { createEventStore } from '../classes/eventStore'

interface RegisterContextParams {
    context: Context;
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
    get: <EventType, TypeOfEventType>(context: Context, id?: string) => Promise<RegisteredContext>;
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

        // Event emitter is shared between events and registered context. That way we can handle requests outside of event store
        const emitter = new EventEmitter();
        const eventStore = createEventStore({ emitter, context, stateStore });

        // Forward requests from emitted state to async request handler
        const subscribeToRequest = (type: string, callback: (event: Event) => Promise<any>): void => {
            emitter.on(type, async (event: Event) => {
                try {
                    const response = await callback(event.payload);
                    eventStore.emit({
                        type: event.type,
                        payload: { response }
                    })
                } catch (error) {
                    eventStore.emit({
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
            stateStore
        } as RegisteredContext
        registeredContexts.push(registeredContext);

        return registeredContext;
    };

    const get = async <EventType, TypeOfEventType>(context: Context, id: string = null) => {
        return registeredContexts.find(registeredContext => registeredContext.context === context && (!!id ? registeredContext.id === id : true));
    };

    const getParent = (id: string) => {
        while (true) {
            if (!parent) {
                return null;
            }

            if (parent.id === id) {
                return parent;
            }

            parent = parent.parent;
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