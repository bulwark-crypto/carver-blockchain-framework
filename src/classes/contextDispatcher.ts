import { EventEmitter } from "events"
import { Context, State } from "./interfaces/context";
import { Event } from './interfaces/events'
import { EventStore } from './interfaces/eventStore'
import { withState } from "./logic/withState";
import { PermanentStore } from "./interfaces/permanentStore";

interface StateStore {
    state: any;
}
export interface RegisteredContext {
    context: Context;
    id: string;
    dispatch: (event: Event) => Promise<void>;
    subscribeToRequest: (type: string, callback: (event: Event) => Promise<any>) => void;

    stateStore: StateStore;
    eventStore: EventStore;
    permanentStore: PermanentStore;
}
interface EventStoreParams {
    emitter: EventEmitter;
    context: Context;
    stateStore: StateStore;
    permanentStore: PermanentStore;
    eventStore: EventStore;
}
interface QueryParams {
    context: RegisteredContext;
}
const bindContextDispatcher = ({ emitter, context, stateStore, permanentStore, eventStore }: EventStoreParams) => {

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
                //console.log('emit:', event);
                emitter.emit(event.type, event);
            });
        }
    }
    const emitCurrentStateStore = async () => {
        const { store, ...stateWithoutStorage } = stateStore.state;

        // Store state without storage
        stateStore.state = stateWithoutStorage;

        if (store) {
            await permanentStore.store(store);
            console.log('store:', store);
        }
    }

    /**
     * Command state
     */
    const dispatch = async (event: Event): Promise<void> => {
        // Note that his can throw (Notice that state chain is built into expected emit state return)
        const reducerResults = context.reducer({ state: stateStore.state, event }) as any;
        stateStore.state = reducerResults.isStateChain ? reducerResults.state : reducerResults;

        //@todo One thing that is possible to do here is to not emit the store / events right away and add some batching. That way multiple events can be emitted in a batch


        await emitCurrentStateStore();
        await emitCurrentStateEvents();

        await emitCurrentStateRequests();
    }


    return {
        dispatch
    }
}

export {
    bindContextDispatcher
}