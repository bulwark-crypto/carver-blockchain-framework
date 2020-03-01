
import { Event } from '../interfaces/events'

import { ReplayEventsParams } from '../interfaces/eventStore';

import * as amqp from "amqplib";
import * as uuidv4 from 'uuid/v4'

import { ContextStore, createRegisteredContext, RegisterContextResponse } from './contextStore'
import { RegisteredContext, RegisterContextParams } from './registeredContext'
import { Context } from '../interfaces/context';

interface ContextMapParams {
    id: string;
}
interface RemoteRegisteredContext {
    queryStorage: (query: string, payload?: any) => Promise<any>;

    dispatch: (event: Event) => Promise<void>;
    streamEvents: (params: ReplayEventsParams) => Promise<void>;

    //disconnect: () => Promise<void>; //@todo
}
export interface RemoteContextStore {
    register: ({ id, context }: RegisterContextParams, options?: any) => Promise<RegisterContextResponse>;
    get: (context: any, id?: string) => Promise<RemoteRegisteredContext>; //@todo this should also be possible via node-ipc (just hash the context). OR we can just remove it to reduce complexity.
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
    const conn = await amqp.connect('amqp://localhost?heartbeat=5s');//@todo move to config
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

        const newRemoteContextStore = await createContextStore({ id: contextStoreId });
        contextStores.set(contextStoreId, newRemoteContextStore);

        return newRemoteContextStore;
    }
    const createContextStore = async ({ id: contextStoreId }: ContextMapParams): Promise<RemoteContextStore> => {
        const channel = defaultChannel; //@todo this can be specified on per-context store basis

        const getNetworkId = (context: Context, contextId: string) => {
            return `[${contextStoreId}][${context.commonLanguage.type}]${!!contextId ? `${contextId}` : ''}`
        }

        const registeredContexts = new Set<RegisteredContext>();
        const registeredContextsById = new Map<string, RegisteredContext>(); // Allows quick access to a context by it's id

        const register = async ({ id: contextId, storeEvents, context }: RegisterContextParams) => {
            const id = getNetworkId(context, contextId);

            const { registeredContext, stateStore } = await createRegisteredContext({ id, storeEvents, context });

            registeredContexts.add(registeredContext);
            registeredContextsById.set(id, registeredContext);

            // Event stream requests queue (someone will ask for a set of events from a certain position)
            const eventStreamRequestsQueue = `${id}.eventStreamRequests`;
            await channel.assertQueue(eventStreamRequestsQueue, { durable: false, });
            await channel.consume(eventStreamRequestsQueue, async (msg) => {
                const replayEventsParams = unbufferObject<ReplayEventsParams>(msg);

                await registeredContext.streamEvents({
                    ...replayEventsParams,
                    callback: async (event) => {
                        channel.sendToQueue(msg.properties.replyTo, bufferObject(event))
                    }
                })

                channel.ack(msg);
            }, { noAck: false })

            // Commands
            const dispatchQueue = `${id}.dispatch`;
            await channel.assertQueue(dispatchQueue, { durable: false }); //@todo should dispatch queue be durable?
            await channel.consume(dispatchQueue, async (msg) => {
                const event = unbufferObject<Event>(msg);

                try {
                    await registeredContext.dispatch(event)
                    channel.ack(msg); // This command was processed without errors
                } catch (err) {
                    //@todo add deadletter queue?
                    channel.nack(msg, false, false); // Fail message and don't requeue it, go to next command
                }
            }, { noAck: false })

            // Queries
            const queryStorageRequestsQueue = `${id}.queryStorageRequests`;
            await channel.assertQueue(queryStorageRequestsQueue, { durable: false });
            await channel.consume(queryStorageRequestsQueue, async (msg) => {
                const { type, payload } = unbufferObject<Event>(msg);
                const { correlationId, replyTo } = msg.properties;

                try {
                    const response = await registeredContext.query(type, payload);

                    await channel.sendToQueue(replyTo, bufferObject(response), {
                        correlationId
                    });

                    channel.ack(msg); // This command was processed without errors
                } catch (err) {
                    //@todo add deadletter queue?
                    //@todo how to handle failed queries?
                    channel.nack(msg, false, false); // Fail message and don't requeue it, go to next command
                }

            });

            return {
                registeredContext,
                stateStore
            }
        }

        const get = async (context: Context, contextId: string = null) => {
            const id = getNetworkId(context, contextId);

            const streamEvents = async (params: ReplayEventsParams) => {
                const eventStreamRequestsQueue = `${id}.eventStreamRequests`;

                const eventStreamQueue = `${id}.eventStream.${uuidv4()}`;

                // Create a temporary queue to accept new events
                await channel.assertQueue(eventStreamQueue, { exclusive: true }); // this queue will be deleted after socket ends

                await channel.consume(eventStreamQueue, async (msg) => {
                    const event = unbufferObject<Event>(msg);

                    //@todo what to do when the event we're streaming throws an exception?
                    await params.callback(event);

                    channel.ack(msg);

                }, { noAck: false });

                const { type, sequence, sessionOnly } = params;
                const message = { type, sequence, sessionOnly };
                channel.sendToQueue(eventStreamRequestsQueue, bufferObject(message), {
                    replyTo: eventStreamQueue
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

            const queryStorageRequestsQueue = `${id}.queryStorageRequests`;
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

                const promise = new Promise((resolve, reject) => {
                    activeQueries.push({
                        correlationId,
                        resolve,
                        reject
                    });
                });

                // Convert to Event and send to queue
                channel.sendToQueue(queryStorageRequestsQueue, bufferObject({ type: query, payload }), {
                    correlationId, // When response comes back into the response queue we can identify for which callback
                    replyTo: queryStorageRepliesQueue
                });

                const reply = await promise;

                return reply;
            }

            return {
                streamEvents,
                dispatch,
                queryStorage
            }
        }


        return {
            register,
            get
        } as any
    }



    return {
        getContextStore
    }
}

export {
    createContextMap
}