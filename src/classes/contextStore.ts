const EventEmitter = require('events');

import { Context, State } from './interfaces/context'
import { Event } from './interfaces/events'
import { PermanentStore } from './interfaces/permanentStore';
import { createEventStore } from './eventStore'
import { bindContextDispatcher } from './contextDispatcher'

//@todo this should be a global permanent store (so store can be non-mongodb)
import { StateStore } from './interfaces/stateStore';
import { EventStore, ReplayEventsParams } from './interfaces/eventStore';

import { config } from '../../config'

import * as amqp from "amqplib";
import * as uuidv4 from 'uuid/v4'
import { RegisterContextParams, RegisteredContext, createRegisteredContext } from './registeredContext';


export interface CreateContextStoreOptions {
    id: string;
    version?: number;
    parent?: any;
}
export interface ContextStore {
    id: string;
    //parent?: ContextStore;
    register: <EventType, TypeOfEventType>({ id, context }: RegisterContextParams, options?: any) => Promise<RegisteredContext>;
    unregister: (id: string) => Promise<void>;
    get: (context: any, id?: string) => Promise<RegisteredContext>; //@todo this should also be possible via node-ipc (just hash the context). OR we can just remove it to reduce complexity.
    getById: (id: string) => Promise<RegisteredContext>;
    getParent: (id: string) => ContextStore;
}



const createContextStore = async ({ id, parent }: CreateContextStoreOptions): Promise<ContextStore> => {
    const registeredContexts = new Set<RegisteredContext>();
    const registeredContextsById = new Map<string, RegisteredContext>(); // Allows quick access to a context by it's id


    const register = async <EventType, TypeOfEventType>({ id, storeEvents, context }: RegisterContextParams) => {
        const registeredContext = await createRegisteredContext({ id, storeEvents, context });
        registeredContexts.add(registeredContext);
        registeredContextsById.set(id, registeredContext);

        return registeredContext;
    }

    const unregister = async (id: string) => {
        const registeredContext = registeredContextsById.get(id);
        if (!registeredContext) {
            //@todo Should we throw an exception if a context was not found with this id or silently fail?
            return;
        }

        // Disconnect all event streams ( emitter.off() )
        await registeredContext.disconnect()

        registeredContexts.delete(registeredContext);
        registeredContextsById.delete(id);
    }

    const get = async <EventType, TypeOfEventType>(context: Context, id: string = null) => {
        for (const registeredContext of registeredContexts) {
            if (registeredContext.context === context) {
                if (!id) {
                    return registeredContext;
                }

                if (id === registeredContext.id) {
                    return registeredContext;
                }
            }
        }
    };
    const getById = async <EventType, TypeOfEventType>(id: string) => {
        return registeredContextsById.get(id);
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
        //parent,
        register,
        unregister,
        get,
        getById,
        getParent
    };
}



export {
    createRegisteredContext,
    createContextStore
}