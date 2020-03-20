
import { Event } from '../interfaces/events'

import { ReplayEventsParams } from '../interfaces/eventStore';

import * as amqp from "amqplib";
import * as uuidv4 from 'uuid/v4'

import { ContextStore, createRegisteredContext, RegisterContextResponse } from './contextStore'
import { RegisteredContext, RegisterContextParams } from './registeredContext'
import { Context } from '../interfaces/context';
import { config } from '../../../config';

interface ContextMapParams {
    id: string;
}
enum QueueType {
    EventStreamRequest = 'EVENT_STREAM_REQUEST',
    Query = 'QUERY'
}

interface RemoteRegisteredContext {
    queryStorage: (query: string, payload?: any) => Promise<any>;

    dispatch: (event: Event) => Promise<void>;
    streamEvents: (params: ReplayEventsParams) => Promise<void>;

    //disconnect: () => Promise<void>; //@todo
}
interface RemoteContextStoreParams {
    context?: any;
    id?: string;

    /**
     * If specified query responses will be forwarded to this context queue (and then callback will be executed)
     */
    replyToContext: RegisteredContext;
}
export interface RemoteContextStore {
    getRemote: (params: RemoteContextStoreParams) => Promise<RemoteRegisteredContext>;
    register: ({ id, context }: RegisterContextParams, options?: any) => Promise<RegisterContextResponse>;
    unregister: (params: RemoteContextStoreParams) => Promise<void>;
}

export interface ContextMap {
    getContextStore: (params: ContextMapParams) => Promise<RemoteContextStore>;
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
    await defaultChannel.prefetch(1); // Limit each consumer to max processing of 1 message

    const bufferObject = (objectToBuffer: any) => {
        return Buffer.from(JSON.stringify(objectToBuffer))
    }
    const unbufferObject = <T>(msg: amqp.Message): T => {
        return JSON.parse(msg.content.toString())
    }

    const contextStores = new Map<string, RemoteContextStore>();

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

        const getNetworkId = (context: Context, contextId: string) => {
            if (!context) {
                return `[${contextStoreId}][${contextId}]`;
            }

            return `[${contextStoreId}][${context.commonLanguage.type}]${!!contextId ? `[${contextId}]` : ''}`
        }

        const registeredContexts = new Set<RegisteredContext>();
        const registeredContextsById = new Map<string, RegisteredContext>(); // Allows quick access to a context by it's id

        const register = async ({ id: contextId, storeEvents, context }: RegisterContextParams) => {
            const id = getNetworkId(context, contextId);

            const { registeredContext, stateStore } = await createRegisteredContext({ id, storeEvents, context });

            registeredContexts.add(registeredContext);
            registeredContextsById.set(id, registeredContext);

            const queueName = id;

            await channel.assertQueue(queueName, { exclusive: true }); // this queue will be deleted after socket ends
            await channel.consume(queueName, async (msg) => {
                const { correlationId, replyTo } = msg.properties;

                switch (msg.properties.type) {
                    // Event stream requests queue (someone will ask for a set of events from a certain position)
                    case QueueType.EventStreamRequest:
                        const replayEventsParams = unbufferObject<ReplayEventsParams>(msg);

                        try {
                            //@todo would be great if we don't stream all events and do them in batches (ex: request 50 at a time). Otheriwse if consumer exits unexpectedly there will be a lot of wasted events.
                            await registeredContext.streamEvents({
                                ...replayEventsParams,
                                callback: async (event) => {
                                    channel.sendToQueue(msg.properties.replyTo, bufferObject(event), {
                                        correlationId
                                    });
                                }
                            })

                            channel.ack(msg);
                        } catch (err) {
                            //@todo add deadletter queue?
                            //@todo how to handle failed queries?
                            channel.nack(msg, false, false); // Fail message and don't requeue it, go to next command
                        }
                        break;
                    case QueueType.Query:
                        const { type, payload } = unbufferObject<Event>(msg);

                        try {
                            const response = await registeredContext.query(type, payload);

                            channel.sendToQueue(replyTo, bufferObject(response), {
                                correlationId
                            });

                            channel.ack(msg); // This command was processed without errors
                        } catch (err) {
                            //@todo add deadletter queue?
                            //@todo how to handle failed queries?
                            channel.nack(msg, false, false); // Fail message and don't requeue it, go to next command
                        }
                        break;
                }

            }, { noAck: false })

            // Commands
            /*const dispatchQueue = `${id}.dispatch`;
            await channel.assertQueue(dispatchQueue, { durable: false }); //@todo should dispatch queue be durable?
            await channel.consume(dispatchQueue, async (msg) => {
                const event = unbufferObject<Event>(msg);

                try {
                    await registeredContext.dispatch(event);

                    //@todo it might make sense to handle dispatching like queries. You can await dispatch() to make sure it executes

                    channel.ack(msg); // This command was processed without errors
                } catch (err) {
                    //@todo add deadletter queue?
                    channel.nack(msg, false, false); // Fail message and don't requeue it, go to next command
                }
            }, { noAck: false })*/

            // Queries


            return {
                registeredContext,
                stateStore
            }
        }

        const getRemote = async ({ context, id: contextId, replyToContext }: RemoteContextStoreParams) => {
            const id = getNetworkId(context, contextId);

            const replyToId = getNetworkId(replyToContext.context, replyToContext.id);

            const remoteQueueName = id;
            const replyToQueueName = id;

            const streamEvents = async (params: ReplayEventsParams) => {
                //const eventStreamRequestsQueue = `${id}.eventStreamRequests`;

                //const eventStreamQueue = `${id}.eventStream.${!!params.type ? params.type : '*'}.${uuidv4()}`;

                // Create a temporary queue to accept new events
                //await channel.assertQueue(eventStreamQueue, { exclusive: true }); // this queue will be deleted after socket ends

                /*
                await channel.consume(eventStreamQueue, async (msg) => {
                    const event = unbufferObject<Event>(msg);

                    //@todo what to do when the event we're streaming throws an exception?
                    await params.callback(event);

                    channel.ack(msg);

                }, { noAck: false });*/

                const { type, sequence, sessionOnly } = params;
                const message = { type, sequence, sessionOnly };

                channel.sendToQueue(remoteQueueName, bufferObject(message), {
                    replyTo: replyToQueueName
                    //@todo correlationId?
                })
            }

            const dispatchQueue = `${id}.dispatch`;
            await channel.assertQueue(dispatchQueue, { durable: false }); //@todo should dispatch queue be durable?

            const dispatch = async (event: Event) => {
                channel.sendToQueue(dispatchQueue, bufferObject(event), {
                    //@todo correlationId? Would be useful for deadletter queue
                })
            }

            const queryStorageRepliesQueue = `${id}.queryStorageReplies.${uuidv4()}`;
            let activeQueries: any[] = [];

            const bindQueryStream = async () => {
                await channel.assertQueue(queryStorageRepliesQueue, { exclusive: true }); // this queue will be deleted after socket ends
                await channel.consume(queryStorageRepliesQueue, async (msg) => {
                    const reply = unbufferObject<any>(msg);
                    const { correlationId } = msg.properties;

                    activeQueries = activeQueries.reduce((activeQueries, activeQuery) => {
                        if (activeQuery.correlationId === correlationId) {
                            activeQuery.resolve(reply);
                            return activeQueries;
                        }

                        return [...activeQueries, activeQuery];
                    }, [])

                    channel.ack(msg);
                });
            }
            await bindQueryStream();

            const queryStorage = async (query: string, payload: any) => {
                const correlationId = uuidv4();

                const queryPromise = new Promise((resolve, reject) => {
                    activeQueries.push({
                        correlationId,
                        resolve,
                        reject
                    });
                });

                // Convert to Event and send to queue
                const queryStorageRequestsQueue = `${id}.queryStorageRequests`;
                channel.sendToQueue(queryStorageRequestsQueue, bufferObject({ type: query, payload }), {
                    correlationId, // When response comes back into the response queue we can identify for which callback
                    replyTo: queryStorageRepliesQueue
                });

                const reply = await queryPromise;

                return reply;
            }

            return {
                streamEvents,
                dispatch,
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
            getRemote
        }
    }



    return {
        getContextStore
    }
}

export {
    createContextMap
}