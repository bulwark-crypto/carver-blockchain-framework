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
        const { emit } = stateStore.state;

        // There are new events to emit to subscribers
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

            // reset emit state as we've emitted all events
            stateStore.state = {
                ...stateStore.state,
                emit: []
            }
        }
    }

    const emitCurrentStateRequests = async () => {
        const { request, ...stateWithoutRequest } = stateStore.state;
        stateStore.state = stateWithoutRequest;

        if (request) {
            request.forEach((event: Event) => {
                //console.log('emit:', event);
                emitter.emit(event.type, event);
            });
        }
    }

    /**
     * Command state
     */
    const emit = async (event: Event): Promise<void> => {
        try {
            const reducerResults = withState(stateStore.state).reduce({ event, callback: context.reducer });
            stateStore.state = reducerResults.state;
        } catch (err) {
            if (context.commonLanguage) {
                // We'll get a description of the error, find the matching key and re-throw an object exception
                const matchingErrors = Object.entries(context.commonLanguage).find(errorEntry => {
                    const [type, description] = errorEntry;
                    return err === description;
                })

                if (matchingErrors) {
                    const [type, description] = matchingErrors;
                    throw { type, description };
                }

                throw err; // re-throw
            }
        }

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