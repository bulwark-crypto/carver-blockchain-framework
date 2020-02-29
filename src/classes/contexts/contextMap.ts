const EventEmitter = require('events');

import { Context, State } from '../interfaces/context'
import { Event } from '../interfaces/events'
import { PermanentStore } from '../interfaces/permanentStore';
import { createEventStore } from '../eventStore'
import { bindContextDispatcher } from '../contextDispatcher'

//@todo this should be a global permanent store (so store can be non-mongodb)
import { StateStore } from '../interfaces/stateStore';
import { EventStore, ReplayEventsParams } from '../interfaces/eventStore';

import { config } from '../../../config'

import * as amqp from "amqplib";
import * as uuidv4 from 'uuid/v4'

import { ContextStore, createRegisteredContext } from '../contextStore'
import { RegisteredContext, RegisterContextParams } from '../registeredContext'

interface ContextMapParams {
    id: string;
}

export interface ContextMap {
    getContextStore: (params: ContextMapParams) => Promise<ContextStore>;
}

const createContextMap = async (): Promise<ContextMap> => {

    /*
    dispatch = push/pull
    query = request/respond
    stream events = pub/sub ( + query for initial set of events)
    */

    const conn = await amqp.connect('amqp://localhost?heartbeat=5s');//@todo move to config
    const defaultChannel = await conn.createChannel();

    const bufferObject = (objectToBuffer: any) => {
        return Buffer.from(JSON.stringify(objectToBuffer))
    }
    const unbufferObject = <T>(msg: amqp.Message): T => {
        return JSON.parse(msg.content.toString())
    }

    const getContextStore = async (): Promise<ContextStore> => {
        const channel = defaultChannel; //@todo this can be specified on per-context store basis

        const registeredContexts = new Set<RegisteredContext>();
        const registeredContextsById = new Map<string, RegisteredContext>(); // Allows quick access to a context by it's id

        const register = async <EventType, TypeOfEventType>({ id, storeEvents, context }: RegisterContextParams) => {
            const registeredContext = await createRegisteredContext({ id, storeEvents, context });

            registeredContexts.add(registeredContext);
            registeredContextsById.set(id, registeredContext);


            await channel.assertQueue(`${id}.queryRequests`, { durable: false });

            // Event stream requests queue (someone will ask for a set of events from a certain position)
            const eventStreamRequestsQueue = `${id}.eventStreamRequests`;
            await channel.assertQueue(eventStreamRequestsQueue, { durable: false });
            channel.consume(eventStreamRequestsQueue, async (msg) => {
                const replayEventsParams = unbufferObject<ReplayEventsParams>(msg);

                console.log('++got eventStreamRequestsQueue', replayEventsParams);

                await registeredContext.streamEvents({
                    ...replayEventsParams,
                    callback: async (event) => {
                        channel.sendToQueue(msg.properties.replyTo, bufferObject(event))
                    }
                })

                channel.ack(msg);
            }, { noAck: false })

            const dispatchQueue = `${id}.dispatch`;
            await channel.assertQueue(dispatchQueue, { durable: false }); //@todo should dispatch queue be durable?
            channel.consume(dispatchQueue, async (msg) => {
                const event = unbufferObject<Event>(msg);

                try {
                    await registeredContext.dispatch(event)
                    channel.ack(msg); // This command was processed without errors
                } catch (err) {
                    //@todo add deadletter queue?
                    channel.nack(msg, false, false); // Fail message and don't requeue it 
                }
            }, { noAck: false })

            return {
                ...registeredContext
            }

        }

        const getById = async (id: string) => {
            const dispatchQueue = `${id}.dispatch`;
            const eventStreamRequestsQueue = `${id}.eventStreamRequests`;

            await channel.assertQueue(dispatchQueue, { durable: false });//@todo should dispatch queue be durable?

            const streamEvents = async (params: ReplayEventsParams) => {
                const tempId = uuidv4();
                const eventStreamQueue = `${id}.eventStream.${tempId}`;

                // Create a temporary queue to accept new events
                await channel.assertQueue(eventStreamQueue, { exclusive: true }); // this queue will be deleted after socket ends

                channel.consume(eventStreamQueue, async (msg) => {
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

            const dispatch = async (event: Event) => {

                channel.sendToQueue(dispatchQueue, bufferObject(event), {
                    //@todo correlationId? Would be useful for deadletter queue
                })
            }

            return {
                streamEvents,
                dispatch
            }
        }

        return {
            register,
            getById
        } as any
    }

    return {
        getContextStore
    }
}

export {
    createContextMap
}