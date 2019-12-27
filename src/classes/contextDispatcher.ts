import { EventEmitter } from "events"
import { Context, State } from "./interfaces/context";
import { Event } from './interfaces/events'
import { EventStore } from './interfaces/eventStore'
import { StateStore } from './interfaces/stateStore'
import { withState } from "./logic/withState";
import { PermanentStore } from "./interfaces/permanentStore";

interface EventStoreParams {
    emitter: EventEmitter;
    context: Context;
    stateStore: StateStore;
    storeSubscriptions: Map<string, ((payload: any) => Promise<any>)[]>;
    eventStore: EventStore;
}
const bindContextDispatcher = ({ emitter, context, stateStore, storeSubscriptions, eventStore }: EventStoreParams) => {

    /**
     * Emits any outstanding events in state
     */
    const emitCurrentStateEvents = async () => {
        const { emit, ...stateWithoutEvents } = stateStore.state;

        // Store state without emit
        stateStore.state = stateWithoutEvents

        if (emit) {
            // Store newly emitted events
            await eventStore.store(emit);

            // notify all subscribers that there is a new event of the types in permanent store
            (emit as Event[]).forEach((event) => {
                emitter.emit(event.type, event);

                // The event is emitted second time to any wildcard listeners (ex: any widget events)
                emitter.emit('*', { type: event.type, event });
            });

        }

    }

    const emitCurrentStateRequests = async () => {
        const { request, ...stateWithoutRequests } = stateStore.state;

        // Store state without request
        stateStore.state = stateWithoutRequests;

        if (request) {
            request.forEach((event: Event) => {
                emitter.emit(event.type, event); // Notice that we pass the entire event as the payload. This is done to be able to access the type of event in the callback.
            });
        }
    }
    const emitCurrentStateStore = async () => {
        const { store, ...stateWithoutStorage } = stateStore.state;

        // Store state without storage
        stateStore.state = stateWithoutStorage;

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

    /**
     * Emit current state effects (store/events/requests)
     */
    const emitSideffects = async (): Promise<void> => {

        //@todo One thing that is possible to do here is to not emit the store / events right away and add some batching. That way multiple events can be emitted in a batch

        await emitCurrentStateStore();
        await emitCurrentStateEvents();

        await emitCurrentStateRequests();
    }


    return {
        emitSideffects
    }
}

export {
    bindContextDispatcher
}