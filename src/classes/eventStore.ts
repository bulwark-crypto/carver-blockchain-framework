import { EventEmitter } from "events"
import { Context, State } from "./interfaces/context";
import { Event } from './interfaces/events'
import { withState } from "./logic/withState";

interface StateStore {
    state: any;
}
export interface RegisteredContext {
    context: Context;
    eventStore: ReturnType<typeof createEventStore>;
    id: string;
    stateStore: StateStore;
    subscribeToRequest: (type: string, callback: (event: Event) => Promise<any>) => void;
}
interface EventStoreParams {
    emitter: EventEmitter;
    context: Context;
    stateStore: StateStore;
}
interface QueryParams {
    context: RegisteredContext;
}
interface StoredEvent extends Event {
    id: number;
}
interface SelfEventSubscription {
    type: string;
    callback: (event: Event) => Promise<void>;
}
interface ReplayEventsParams {
    type: string;
    callback: (event: Event) => Promise<void>;
    //@todo add lastPlayedId
}
const createEventStore = ({ emitter, context, stateStore }: EventStoreParams) => {
    const storedEvents: StoredEvent[] = []
    const selfSubscriptions: SelfEventSubscription[] = [];

    const replayEventsToCallback = ({ type, callback }: ReplayEventsParams): void => {
        const subscriber = {
            isReplaying: false,
            lastPlayedId: undefined as number
        }

        const replayEvents = async () => {
            // Ensure only one set of events can be replayed at a time
            if (subscriber.isReplaying) {
                return;
            }
            subscriber.isReplaying = true;

            // Fetch new events to replay            
            while (true) {
                const permanentEventsByType = type === '*' ? storedEvents : storedEvents.filter(event => event.type === type);
                const eventsToReplay = subscriber.lastPlayedId !== undefined ? permanentEventsByType.filter(event => event.id > subscriber.lastPlayedId) : permanentEventsByType;

                if (eventsToReplay.length === 0) {
                    break;
                }

                // Replay new events
                for await (const eventToReplay of eventsToReplay) {
                    const { id, ...event } = eventToReplay;

                    await callback(event);

                    //await context.eventStore.emit(event);

                    subscriber.lastPlayedId = id;
                }
            }

            subscriber.isReplaying = false;
        }

        // Once new event of this type comes to our context, replay all events that occured since the last time it was played
        emitter.on(type, () => {
            replayEvents();
        });

        // Replay all events from event store on this context
        replayEvents();
    }

    /**
     * Emits any outstanding events in state
     */
    const emitCurrentStateEvents = async () => {
        const { emit, ...stateWithoutEvents } = stateStore.state;

        // Store state without emit
        stateStore.state = stateWithoutEvents

        if (emit) {
            // Store any new events to emit
            const storedEventsToEmit: StoredEvent[] = []
            emit.forEach((event: Event) => {
                const storedEvent = {
                    ...event,
                    id: storedEvents.length
                } as StoredEvent
                storedEventsToEmit.push(storedEvent)

                // This can be async and take a while. The goal is that store is guaranteed before notify
                storedEvents.push(storedEvent);
            });

            // notify all subscribers that there is a new event of the types in permanent store
            storedEventsToEmit.forEach((storedEvent) => {
                emitter.emit(storedEvent.type, storedEvent);

                // The event is emitted second time to any wildcard listeners (ex: any widget events)
                emitter.emit('*', { type: storedEvent.type, event: storedEvent });
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
            console.log('store:', store);
        }
    }

    /**
     * Command state
     */
    const emit = async (event: Event): Promise<void> => {
        // Note that his can throw (Notice that state chain is built into expected emit state return)
        const reducerResults = context.reducer({ state: stateStore.state, event }) as any;
        stateStore.state = reducerResults.isStateChain ? reducerResults.state : reducerResults;

        //@todo One thing that is possible to do here is to not emit the store / events right away and add some batching. That way multiple events can be emitted in a batch

        await emitCurrentStateStore();
        await emitCurrentStateEvents();

        await emitCurrentStateRequests();
    }


    return {
        replayEventsToCallback,
        emit
    }
}

export {
    createEventStore
}