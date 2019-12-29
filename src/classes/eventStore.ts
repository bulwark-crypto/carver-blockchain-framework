import { Event } from './interfaces/events'
import { EventEmitter } from 'events';
import { EventStore, ReplayEventsParams } from './interfaces/eventStore';
import { dbStore } from './adapters/mongodb/mongoDbInstance'

interface StoredEvent extends Event {
    sequence: number;
}
interface CreateEventStoreParams {
    emitter: EventEmitter;
    id: string;
}

//@todo remove emitter from here
const createEventStore = async ({ emitter, id }: CreateEventStoreParams): Promise<EventStore> => {
    const storedEvents: StoredEvent[] = [];

    const db = await dbStore.get();

    console.log(`Initializing Event Store: ${id}`)

    const eventsCollectionName = `eventStore_${id}`;


    const initializeEventStore = async () => {

        const version = await db.collection('versions').findOne({ id: eventsCollectionName });
        if (!version) {
            await db.collection(eventsCollectionName).createIndex({ sequence: 1 }, { unique: true });

            await db.collection('versions').insertOne({ id: eventsCollectionName, version: 1 });
        }

    }
    await initializeEventStore();


    const store = async (events: Event[]) => {
        // Store any new events to emit
        const storedEventsToEmit: StoredEvent[] = []
        events.forEach((event: Event) => {
            const storedEvent = {
                ...event,
                sequence: storedEvents.length
            } as StoredEvent
            storedEventsToEmit.push(storedEvent)

            // This can be async and take a while. The goal is that store is guaranteed before notify
            storedEvents.push(storedEvent);
        });

        //@todo

    }
    const streamEvents = ({ type, callback }: ReplayEventsParams): void => {
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
                const eventsToReplay = subscriber.lastPlayedId !== undefined ? permanentEventsByType.filter(event => event.sequence > subscriber.lastPlayedId) : permanentEventsByType;

                if (eventsToReplay.length === 0) {
                    break;
                }

                // Replay new events
                for await (const eventToReplay of eventsToReplay) {
                    const { sequence, ...event } = eventToReplay;

                    await callback(event);

                    //await context.eventStore.emit(event);

                    subscriber.lastPlayedId = sequence;
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

    return {
        store,
        streamEvents
    }

}

export {
    createEventStore
}