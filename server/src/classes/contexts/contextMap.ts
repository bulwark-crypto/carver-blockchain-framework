
import { Event } from '../interfaces/events'

import { ReplayEventsParams } from '../interfaces/eventStore';

import * as amqp from "amqplib";
import * as uuidv4 from 'uuid/v4'

import { ContextStore, createRegisteredContext, RegisterContextResponse } from './contextStore'
import { RegisteredContext, RegisterContextParams } from './registeredContext'
import { Context } from '../interfaces/context';
import { config } from '../../../config';

import * as async from 'async';
import { AsyncQueue } from 'async';

interface ContextMapParams {
    id: string;
}
enum QueueType {
    //@todo Is event stream request just another type of query?
    EventStreamRequest = 'EventStreamRequest',
    EventStreamResponse = 'EventStreamResponse',

    QueryRequest = 'QueryRequest',
    QueryResponse = 'QueryResponse',

    CheckpointResponse = 'CheckpointResponse',
}

interface RemoteRegisteredContext {
    queryStorage: (query: string, payload?: any) => Promise<any>;
    streamEvents: (params: ReplayEventsParams) => Promise<void>;
    //disconnect: () => Promise<void>; //@todo
}
interface GetLocalParams {
    context?: any;
    id?: string;
}
interface RemoteContextStoreParams {
    context?: any;
    id?: string;

    /**
     * When fetching remote contexts we need to tell where to stream replies back to (including queries and event streams)
     */
    replyToContext: RegisteredContext;
}
export interface RemoteContextStore {
    getRemote: (params: RemoteContextStoreParams) => Promise<RemoteRegisteredContext>;
    getLocal: (params: GetLocalParams) => Promise<RegisteredContext>;
    register: ({ id, context }: RegisterContextParams, options?: any) => Promise<RegisterContextResponse>;
    unregister: (params: RemoteContextStoreParams) => Promise<void>;
}

export interface ContextMap {
    getContextStore: (params: ContextMapParams) => Promise<RemoteContextStore>;
}

const localConfig = {
    /**
     * Only transmit events in batches if it is the latest event OR if the queue is of this size. (So you'll never get more than this many events but it might just be 1 if it's the latest)
     */
    batchQueueSize: 20,

    /**
     * After this many events we'll create a promise that needs to be resolved. No other events will be sent to the event stream request.
     * The source of the event stream request must respond to the checkpoint (this will resolve the promise) so more events can be sent.
     * This is done to avoid flooding the event stream request source with thousands of events that haven't been processed.
     */
    checkpointSize: 50,

    /**
     * If we have a lot of events queued up for processing you need to update your logic as your reducer isn't consuming them fast enough.
     * You will most likely need to update your logic as you shouldn't have this many events in queue to be processed (this events are in memory and most likely need to be in RabbitMQ queue)
     */
    warnQueueLength: 100
}

/*
How we use RabbitMQ messages in a nutshell:

dispatch (aka command) = basic push/pull
query = request/respond
stream events = request/reply
*/
const createContextMap = async (): Promise<ContextMap> => {
    const conn = await amqp.connect(config.rabbitmq.url);//@todo move to config (and this will be a docker container)
    const defaultChannel = await conn.createChannel();
    //await defaultChannel.prefetch(1); // Limit each consumer to max processing of 1 message 

    const bufferObject = (objectToBuffer: any) => {
        return Buffer.from(JSON.stringify(objectToBuffer))
    }
    const unbufferObject = <T>(msg: amqp.Message): T => {
        return JSON.parse(msg.content.toString())
    }

    const contextStores = new Map<string, RemoteContextStore>();
    /**
     * Contains callbacks for both queries and event streams.
     * When the remote context replies to the RegisteredContext queue it'll contain a correlationId that we'll call.
     */
    const correlationIdCallbacks = new Map<string, any>();

    const getContextStore = async ({ id: contextStoreId }: ContextMapParams): Promise<RemoteContextStore> => {

        // Use the context store from cache to avoid having to re-create a new one each time
        if (contextStores.has(contextStoreId)) {
            return contextStores.get(contextStoreId);
        }

        const contextStore = await createContextStore({ id: contextStoreId });
        contextStores.set(contextStoreId, contextStore);

        return contextStore;
    }
    const createContextStore = async ({ id: contextStoreId }: ContextMapParams): Promise<RemoteContextStore> => {
        const channel = defaultChannel; //@todo this can be specified on per-context store basis


        const getCallbackByCorrelationId = (correlationId: string, type: string) => {
            if (!correlationIdCallbacks.has(correlationId)) {
                console.log('Correlation id not found:', correlationId, type);
                throw commonLanguage.errors.CorrelationIdNotFound;
            }

            return correlationIdCallbacks.get(correlationId);
        }

        const getNetworkId = (context: Context, contextId: string) => {
            if (!context) {
                return `${contextStoreId}_${contextId}`;
            }

            return `${contextStoreId}_${context.commonLanguage.type}${!!contextId ? `_${contextId}` : ''}`
        }

        const registeredContexts = new Set<RegisteredContext>();
        const registeredContextsById = new Map<string, RegisteredContext>(); // Allows quick access to a context by it's id

        const register = async ({ id: contextId, storeEvents, context, inMemory }: RegisterContextParams) => {
            const id = getNetworkId(context, contextId);

            const { registeredContext, stateStore } = await createRegisteredContext({ id, storeEvents, context });


            registeredContexts.add(registeredContext);
            registeredContextsById.set(id, registeredContext);

            const bindRabbitMQ = async () => {
                const queueName = id;

                const eventStreamQueues = new Map<string, AsyncQueue<any>>(); // string is the correlationId


                await channel.assertQueue(queueName, { exclusive: true }); // this queue will be deleted after socket ends
                await channel.consume(queueName, async (msg) => {
                    const { correlationId, replyTo, type } = msg.properties;

                    switch (type) {
                        // Event stream requests queue (someone will ask for a set of events from a certain position)
                        case QueueType.EventStreamRequest:
                            const replayEventsParams = unbufferObject<ReplayEventsParams>(msg);

                            try {
                                //@todo would be great if we don't stream all events and do them in batches (ex: request 50 at a time). Otheriwse if consumer exits unexpectedly there will be a lot of wasted events.
                                //@todo it's possible to batch replies as well (ex: 5 events per message)

                                let eventsQueue: Event[] = []

                                // Track how many events were replied back to requester
                                let checkpointCounter = 0;

                                await registeredContext.streamEvents({
                                    ...replayEventsParams,
                                    callback: async (event, isLatest) => {
                                        eventsQueue.push(event);

                                        checkpointCounter++;

                                        // Send out events to RabbitMQ if we reached our batch max size or it's the most recent event
                                        if (eventsQueue.length >= localConfig.batchQueueSize || isLatest) {

                                            let checkpointCorrelationId: string = null;

                                            // Hold off on sending any more events if checkpoint is required
                                            if (checkpointCounter >= localConfig.checkpointSize) {
                                                checkpointCorrelationId = uuidv4();

                                                // Push in additional event that event checkpoint was hit. 
                                                // When the stream requester is parsing events and gets to this event type, he'll reply back with the matching correlationId
                                                //@todo maybe this should be the first event in the batch? That way the response is sent early on while other events are processing.
                                                eventsQueue.push({
                                                    type: commonLanguage.events.CheckpointHit,
                                                    payload: {
                                                        correlationId: checkpointCorrelationId,
                                                        replyTo
                                                    }
                                                });

                                                console.log('**checkpoint required:', event.type, replyTo)
                                                checkpointCounter = 0;
                                            }

                                            if (!channel.sendToQueue(replyTo, bufferObject(eventsQueue), {
                                                correlationId,
                                                type: QueueType.EventStreamResponse

                                            })) {
                                                throw commonLanguage.errors.EventStreamResponseQueueFailed
                                            }

                                            eventsQueue = [];

                                            // If we need to perform an event checkpoint, we'll create a promise that needs to be filled by correlationid
                                            if (checkpointCorrelationId) {
                                                const checkpointPromise = new Promise((resolve) => {
                                                    correlationIdCallbacks.set(checkpointCorrelationId, { resolve });
                                                });
                                                await checkpointPromise;
                                            }

                                        }
                                    }
                                })

                                //channel.ack(msg);
                            } catch (err) {
                                console.log('Event Stream Request Error:')
                                console.log(err);
                                //@todo add deadletter queue?
                                //@todo how to handle failed queries?
                                //channel.nack(msg, false, false); // Fail message and don't requeue it, go to next command
                            }
                            break;
                        case QueueType.EventStreamResponse:

                            const correlationIdCallback = getCallbackByCorrelationId(correlationId, msg.properties.type);

                            const events = unbufferObject<Event[]>(msg);
                            //channel.ack(msg);

                            if (!eventStreamQueues.has(correlationId)) {
                                // We don't want to await for each message (as an event can query so it'll deadlock waiting for a query as the event can't finish). We'll add it to queue and process one at a time.
                                const eventStreamQueue = async.queue(async (event: Event, callback) => {

                                    // For checkpoints 
                                    if (event.type === commonLanguage.events.CheckpointHit) {
                                        const { correlationId: checkpointCorrelationId, replyTo } = event.payload;

                                        if (!channel.sendToQueue(replyTo, bufferObject({
                                            correlationId: checkpointCorrelationId
                                        }), {
                                            correlationId,
                                            type: QueueType.CheckpointResponse

                                        })) {
                                            throw commonLanguage.errors.CheckpointResponseQueueFailed
                                        }

                                        callback();
                                        return;
                                    }


                                    //@todo what to do when the event we're streaming throws an exception? We need some form of a retry mechanic.
                                    await correlationIdCallback(event);

                                    callback();
                                });
                                eventStreamQueues.set(correlationId, eventStreamQueue);
                            }

                            const asyncQueueByType = eventStreamQueues.get(correlationId);

                            // Response will come in as an array of events
                            for (const event of events) {
                                asyncQueueByType.push(event);

                                if (asyncQueueByType.length() > localConfig.warnQueueLength) {
                                    console.log('Large Event Queue Detected:', event.type, asyncQueueByType.length())
                                }
                            }

                            break;

                        case QueueType.QueryRequest:
                            const { type, payload } = unbufferObject<Event>(msg);

                            try {
                                const response = await registeredContext.query(type, payload);

                                channel.sendToQueue(replyTo, bufferObject(response), {
                                    correlationId,
                                    type: QueueType.QueryResponse
                                });

                                //channel.ack(msg); // This command was processed without errors
                            } catch (err) {
                                console.log(type);
                                console.log('** query error:', err);
                                //@todo add deadletter queue?
                                //@todo how to handle failed queries?
                                //channel.nack(msg, false, false); // Fail message and don't requeue it, go to next command
                            }
                            break;

                        case QueueType.QueryResponse:
                            const reply = unbufferObject<any>(msg);
                            //channel.ack(msg);

                            const queryCallback = getCallbackByCorrelationId(correlationId, msg.properties.type);

                            //@todo callbacks.reject(reply) with nack?
                            correlationIdCallbacks.delete(correlationId); // Queries are removed when they are completed

                            queryCallback.resolve(reply);
                            break;


                        case QueueType.CheckpointResponse:
                            const checkpointResponseEvent = unbufferObject<any>(msg);
                            const { correlationId: checkpointCorrelationId } = checkpointResponseEvent;

                            const checkpointCallback = getCallbackByCorrelationId(checkpointCorrelationId, msg.properties.type)
                            checkpointCallback.resolve();

                            correlationIdCallbacks.delete(checkpointCorrelationId); // Queries are removed when they are completed

                            break;

                        default:
                            console.log('Message type not found:', msg.properties.type)
                            throw commonLanguage.errors.UnknownMessageType;
                    }

                }, { noAck: true });

                console.log('RabbitMQ Queue Bound:', queueName);
            }

            if (!inMemory) {
                await bindRabbitMQ();
            }


            return {
                registeredContext,
                stateStore
            }
        }

        const getLocal = async ({ context, id: contextStoreId }: GetLocalParams) => {
            const id = getNetworkId(context, contextStoreId);

            if (!registeredContextsById.has(id)) {
                throw `${id} local context not found`
            }
            return registeredContextsById.get(id);
        }

        const getRemote = async ({ context, id: contextId, replyToContext }: RemoteContextStoreParams) => {
            const id = getNetworkId(context, contextId);
            const remoteQueueName = id;

            const replyToId = replyToContext.id;
            const replyToQueueName = replyToId;

            const streamEvents = async (params: ReplayEventsParams) => {
                const correlationId = uuidv4();

                correlationIdCallbacks.set(correlationId, params.callback);

                const { type, sequence, sessionOnly } = params;
                const message = { type, sequence, sessionOnly };

                channel.sendToQueue(remoteQueueName, bufferObject(message), {
                    replyTo: replyToQueueName,
                    correlationId,
                    type: QueueType.EventStreamRequest
                })
            }

            const queryStorage = async (query: string, payload: any) => {
                const correlationId = uuidv4();

                const queryPromise = new Promise((resolve, reject) => {
                    correlationIdCallbacks.set(correlationId, { resolve, reject });
                });

                // Convert to Event and send to queue
                channel.sendToQueue(remoteQueueName, bufferObject({ type: query, payload }), {
                    correlationId, // When response comes back into the response queue we can identify for which callback
                    replyTo: replyToQueueName,
                    type: QueueType.QueryRequest
                });

                const reply = await queryPromise;

                return reply;
            }

            return {
                streamEvents,
                queryStorage
            }
        }

        const unregister = async ({ context, id: contextId }: RemoteContextStoreParams) => {
            const id = getNetworkId(context, contextId);

            console.log('@todo unregister:', id)
        }

        return {
            register,
            unregister,
            getLocal,
            getRemote
        }
    }

    return {
        getContextStore
    }
}

const commonLanguage = {
    events: {
        CheckpointHit: 'CHECKPOINT_HIT',
    },
    errors: {
        CorrelationIdNotFound: 'Correlation Id Not Found',
        UnknownMessageType: 'Unknown queue type',
        EventStreamResponseQueueFailed: 'Failed queueing event stream response',
        CheckpointResponseQueueFailed: 'Failed queueing checkpoint response'
    }
}

export {
    createContextMap
}