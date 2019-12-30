import { EventEmitter } from "events"
import { Context, State } from "./interfaces/context";
import { Event } from './interfaces/events'
import { EventStore } from './interfaces/eventStore'
import { StateStore } from './interfaces/stateStore'
import { withState } from "./logic/withState";
import { PermanentStore } from "./interfaces/permanentStore";

interface EventStoreParams {
    emitter: EventEmitter;
    storeSubscriptions: Map<string, ((payload: any) => Promise<any>)[]>;
    eventStore: EventStore;
}
const bindContextDispatcher = ({ emitter, storeSubscriptions, eventStore }: EventStoreParams) => {

    /**
     * Emits any outstanding events in state
     */
    const emitCurrentStateEvents = async (emit: Event[]) => {
        if (emit) {

            // Store newly emitted events (this will add them to db)
            await eventStore.store(emit);

            // Notify all subscribers that there is a new event of the types in permanent store
            // This will also notify eventStore streamEvents() listeners if they are already not replaying
            emit.forEach((event) => {
                emitter.emit(event.type, event);

                // The event is emitted second time to any wildcard listeners (ex: any widget events)
                emitter.emit('*', { type: event.type, event });
            });

        }
    }

    const emitCurrentStateQueries = async (queries: Event[]) => {
        if (queries) {
            queries.forEach((event: Event) => {
                emitter.emit(event.type, event); // Notice that we pass the entire event as the payload. This is done to be able to access the type of event in the callback.
            });
        }
    }
    const emitCurrentStateStore = async (store: any[]) => {
        if (store) {
            //@todo we can do all of this storing in parallel

            // For each .store object find the appropritate handler and forward the payload there.
            for await (const { query, payload } of store) {

                if (!storeSubscriptions.has(query)) {
                    console.log(`Unhandled store query: ${query}`)
                    return;
                }

                const subscriptions = storeSubscriptions.get(query);
                for await (const subscription of subscriptions) {
                    await subscription(payload);
                }
            }
        }
    }

    const emitState = async (state: any) => {

        const { store, emit, request, ...stateWithoutSideEffects } = state;

        // First we ensure that we succeed on .store()
        await emitCurrentStateStore(store);

        // Then we ensure all events are properly stored in event store
        await emitCurrentStateEvents(emit);

        // Lastly emit the queries
        await emitCurrentStateQueries(request);

        return stateWithoutSideEffects;
    }

    return {
        emitState
    }
}

export {
    bindContextDispatcher
}