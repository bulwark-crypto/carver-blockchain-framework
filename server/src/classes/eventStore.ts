import { Event } from './interfaces/events'
import { EventEmitter } from 'events';
import { EventStore, ReplayEventsParams } from './interfaces/eventStore';
import { dbStore } from './adapters/mongodb/mongoDbInstance'

interface StoredEvent extends Event {
    sequence: number;
    date: Date;
}
interface CreateEventStoreParams {
    emitter: EventEmitter;
    id: string;
    storeEvents: boolean;
}

const localConfig = {
    /**
     * How many events to fetch from the event store at a time
     */
    batchSize: 100
}

//@todo remove emitter from here
const createEventStore = async ({ emitter, id, storeEvents }: CreateEventStoreParams): Promise<EventStore> => {
    //const storedEvents: StoredEvent[] = [];

    const db = await dbStore.get();

    const eventsCollectionName = `eventStore_${id}`;

    const initializeEventStore = async () => {
        if (!storeEvents) {
            return;
        }

        const version = await db.collection('versions').findOne({ id: eventsCollectionName });
        if (!version) {
            await db.collection(eventsCollectionName).createIndex({ type: 1, sequence: 1 }, { unique: true }); // for ability to queue by type+sequence
            await db.collection(eventsCollectionName).createIndex({ sequence: 1 }, { unique: true }); // for ability to queue all events

            await db.collection('versions').insertOne({ id: eventsCollectionName, version: 1 });
        }

    }
    await initializeEventStore();

    const getLastEvent = async () => {
        if (!storeEvents) {
            return null;
        }

        const lastEvents = await db.collection(eventsCollectionName).find({}).sort({ sequence: -1 }).limit(1);
        if (lastEvents) {
            for await (const event of lastEvents) {
                return event;
            }
        }

        return null;
    }

    const lastEvent = await getLastEvent();

    let sequence = !!lastEvent ? lastEvent.sequence : 0

    const initialSequence = !!sequence ? sequence : 0;

    console.log(`Event Store: ${id} (sequence: ${sequence}) (storeEvents: ${!!storeEvents})`)

    const store = async (events: Event[]) => {

        const date = new Date();

        let newSequence = sequence;

        // Store any new events to emit
        const storedEvents: StoredEvent[] = []
        events.forEach((event: Event) => {
            newSequence++


            const storedEvent = {
                ...event,
                sequence: newSequence,
                date
            } as StoredEvent

            // This can be async and take a while. The goal is that store is guaranteed before notify
            storedEvents.push(storedEvent);
        });


        if (storeEvents) {
            await db.collection(eventsCollectionName).insertMany(storedEvents);
        }

        // context sequence is now updated after successful inserts
        sequence = newSequence;
    }

    const memoryEvents: StoredEvent[] = [];
    let memorySequence = 0;

    const streams = new Set<any>();

    const streamEvents = ({ type, sequence, callback, sessionOnly }: ReplayEventsParams): void => {
        const subscriber = {
            isReplaying: false,
            sequence: !!sequence ? sequence : (sessionOnly ? initialSequence : 0)
        }

        const getQuery = () => {
            let query = { sequence: { $gt: subscriber.sequence } }
            if (type) {
                return {
                    type,
                    ...query,
                }
            }
            return query
        }

        const replayEvents = async () => {
            // Ensure only one set of events can be replayed at a time
            if (subscriber.isReplaying) {
                return;
            }
            subscriber.isReplaying = true;

            if (storeEvents) {

                // Fetch new events to replay            
                while (true) {
                    const query = getQuery();

                    //@todo look into cursors. Worried that it'll have some sort of internal MB memory limit. This approach might be a bit slower but won't have memory limitation.
                    const eventsToReplay = await db.collection(eventsCollectionName).find(query).limit(localConfig.batchSize).toArray(); // batch size of 100

                    if (eventsToReplay.length === 0) {
                        break;
                    }

                    const { sequence: lastSequence } = eventsToReplay[eventsToReplay.length - 1];

                    // Replay new events
                    for await (const eventToReplay of eventsToReplay) {
                        if (!eventToReplay.sequence) {
                            throw `Invalid event replay sequence: ${type} ${id}`
                        }

                        await callback(eventToReplay, eventToReplay.sequence === lastSequence);

                        subscriber.sequence = eventToReplay.sequence;
                    }
                }
            } else {

                while (true) {
                    if (memoryEvents.length === 0) {
                        break;
                    }

                    const { sequence: lastSequence } = memoryEvents[memoryEvents.length - 1];

                    const eventToReplay = memoryEvents.shift();
                    await callback(eventToReplay, eventToReplay.sequence === lastSequence);

                    subscriber.sequence = eventToReplay.sequence;
                }
            }

            subscriber.isReplaying = false;
        }

        // Once new event of this type comes to our context, replay all events that occured since the last time it was played
        const stream = (eventToReplay: any) => {
            //@todo there is probably a good "async" lib pattern for this
            if (storeEvents) {
                replayEvents();
            } else {
                memoryEvents.push({
                    ...eventToReplay,
                    sequence: memorySequence
                });
                memorySequence++;

                replayEvents();
            }
        }

        emitter.on(type, stream);
        streams.add({ type, stream });

        // Replay all events from event store on this context
        replayEvents();
    }

    const unbindAllListeners = async () => {
        for (const { type, stream } of streams) {
            emitter.off(type, stream);
        }
        streams.clear();
    }

    return {
        store,
        streamEvents,
        unbindAllListeners
    }

}

export {
    createEventStore
}