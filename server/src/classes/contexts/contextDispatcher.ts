import { EventEmitter } from "events"
import { Event } from '../interfaces/events'
import { EventStore } from '../interfaces/eventStore'

interface EventStoreParams {
    emitter: EventEmitter;
    storeHandlers: Map<string, ((payload: any) => Promise<any>)>;
    queryHandlers: Map<string, ((payload: any) => Promise<any>)>;
    eventStore: EventStore;
}
const bindContextDispatcher = ({ emitter, storeHandlers, queryHandlers, eventStore }: EventStoreParams) => {
    const saveToPermanentStore = async (store: any[]) => {
        if (!store) {
            return;
        }

        // First we ensure that we succeed on .store()
        // For each .store object find the appropritate handler and forward the payload there.
        for await (const { query, payload } of store) {
            if (!storeHandlers.has(query)) {
                throw commonLanguage.errors.UnhandledStore
            }

            const storeHandler = storeHandlers.get(query);
            await storeHandler(payload);
        }
    }

    const saveToEventStore = async (emit: Event[]) => {
        if (!emit) {
            return;
        }

        // Store newly emitted events (this will add them to db)
        await eventStore.store(emit);
    }
    const emitEvents = async (emit: Event[]) => {
        if (!emit) {
            return;
        }

        // Notify all subscribers that there is a new event of the types in permanent store
        // This will also notify eventStore streamEvents() listeners if they are already not replaying
        emit.forEach((event) => {
            emitter.emit(event.type, event);

            // The event is emitted second time to any wildcard listeners (ex: any widget events)
            emitter.emit('*', event);
        });
    }
    const emitQueries = async (queries: any) => {
        if (!queries) {
            return;
        }

        // For each .query object find the appropritate handler and forward the payload there.
        for await (const { type, payload } of queries) {
            if (!queryHandlers.has(type)) {
                throw commonLanguage.errors.UnhandledQuery
            }

            const queryHandler = queryHandlers.get(type);
            const queryResponse = await queryHandler(payload);

            // Return on the very first query response (there shouldn't be multiple query handlers for same type)
            return { type, payload: queryResponse }
        }
    }

    return {
        saveToPermanentStore,
        saveToEventStore,
        emitEvents,
        emitQueries
    }
}

const commonLanguage = {
    errors: {
        UnhandledQuery: 'UNHANDLED_QUERY',
        UnhandledStore: 'UNHANDLED_STORE',
    }
}

export {
    bindContextDispatcher
}