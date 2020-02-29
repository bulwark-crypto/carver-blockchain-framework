
import { Context } from '../interfaces/context'
import { RegisterContextParams, RegisteredContext, createRegisteredContext } from './registeredContext';
import { StateStore } from '../interfaces/stateStore';

export interface CreateContextStoreOptions {
    id: string;
    version?: number;
    parent?: any;
}

interface RegisterContextResponse {
    registeredContext: RegisteredContext;
    stateStore: StateStore;
}

export interface ContextStore {
    id: string;
    //parent?: ContextStore;
    register: ({ id, context }: RegisterContextParams, options?: any) => Promise<RegisterContextResponse>;
    unregister: (id: string) => Promise<void>;
    get: (context: any, id?: string) => Promise<RegisteredContext>; //@todo this should also be possible via node-ipc (just hash the context). OR we can just remove it to reduce complexity.
    getById: (id: string) => Promise<RegisteredContext>;
    getParent: (id: string) => ContextStore;
}

const createContextStore = async ({ id, parent }: CreateContextStoreOptions): Promise<ContextStore> => {
    const registeredContexts = new Set<RegisteredContext>();
    const registeredContextsById = new Map<string, RegisteredContext>(); // Allows quick access to a context by it's id

    const register = async ({ id, storeEvents, context }: RegisterContextParams) => {
        const { registeredContext, stateStore } = await createRegisteredContext({ id, storeEvents, context });

        registeredContexts.add(registeredContext);
        registeredContextsById.set(id, registeredContext);

        return { registeredContext, stateStore };
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

    const get = async (context: Context, id: string = null) => {
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
    const getById = async (id: string) => {
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