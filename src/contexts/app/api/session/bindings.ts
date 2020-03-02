import { Event } from '../../../../classes/interfaces/events'
import { withContext } from '../../../../classes/logic/withContext';
import { config } from '../../../../../config';
import * as socketio from "socket.io";
import carverUserContext from '../../carverUser/context'
import carverUserBindings from '../../carverUser/bindings'

import apiSessionContext from './context'

import publicStateContext from '../publicState/context'
import { ContextMap } from '../../../../classes/contexts/contextMap';

const bindContexts = async (contextMap: ContextMap) => {
    const appContextStore = await contextMap.getContextStore({ id: 'APP' });

    const { registeredContext: apiSession, stateStore: apiSessionStateStore } = await appContextStore.register({
        context: apiSessionContext,
        storeEvents: true
    });


    const io = socketio.listen(config.api.socket.port);
    const socketMap = new Map<string, socketio.Socket>();

    const carverUsersContextStore = appContextStore;
    const publicStatesContextStore = appContextStore;

    //const carverUsersContextStore = createContextStore({ id: 'SESSIONS', parent: contextStore });
    // const publicStatesContextStore = createContextStore({ id: 'PUBLIC_STATES', parent: carverUsersContextStore });

    const forwardEventToSocket = async (id: string, event: Event) => {
        // Forward any events a user emits back to socket (ex: widgets will emit on carver user)
        if (!socketMap.has(id)) {
            throw apiSessionContext.commonLanguage.errors.IdNotFound;
        }

        const { type, ...eventWithoutType } = event;
        socketMap.get(id).emit(type, eventWithoutType)
    }

    const initSocketServer = () => {
        /**
         * Extract id from query params (This is the id generated by reservation rest api server)
         */
        const getSocketSessionId = (socket: socketio.Socket) => {
            return socket.handshake.query.id;
        }

        // Hook into socket.io middleware and pass it through Carver Blockchain Framework. 
        // If command is successful there were no errors and reservation was completed successfully.
        io.use(async (socket, next) => {
            try {
                // Request new session connection. If this succeeds then connection was established successfuly.
                const id = getSocketSessionId(socket);

                await apiSession
                    .dispatch({ type: apiSessionContext.commonLanguage.commands.Connect, payload: { id } });
            } catch (error) {
                return next(error);
            }

            return next();
        });

        io.on('connection', async (socket) => {
            const id = getSocketSessionId(socket);
            socketMap.set(id, socket);

            console.log(`Websocket User Connected: ${id}`);

            //@todo try catch around this in case we're trying to access context that isn't registered
            const carverUser = await carverUsersContextStore.get({ context: carverUserContext, id });
            const publicState = await publicStatesContextStore.get({ context: publicStateContext, id });

            await publicState.dispatch({ type: publicStateContext.commonLanguage.commands.Initialize, payload: { id } })

            socket.on('emit', async ({ type, payload }) => {
                //@todo try catch around the dispatch and forward error to publicState

                // Pass down this event to the context (with the socket identifier so we know which context triggered this event). 
                // The single socket context management is done internally by "apiSession" context
                carverUser.dispatch({ type, payload });
            });

            await carverUser.dispatch({ type: carverUserContext.commonLanguage.commands.Connect });
            // @todo we can issue a new socket connection event here
        })
    }

    // @todo right now socket and reservation handler live on the same server. It is possible to split these up
    initSocketServer();

    const createContexts = async (id: string) => {

        //@todo
        console.log('@todo create carver user & public state context')

        await carverUserBindings.bindContexts(contextMap, id);



        /*
        await publicStatesContextStore.register({
            id,
            storeEvents: false, // Do not use event store for emitting (These events are projected out to frontend and do not need to be stored)
            context: publicStateContext
        })
        await publicStateBindings.bindContexts(carverUsersContextStore, publicStatesContextStore, id);
        */
    }

    const bindStreamsAndInitialize = async (id: string) => {
        const carverUser = await carverUsersContextStore.get({ context: carverUserContext, id });
        const publicState = await publicStatesContextStore.get({ context: publicStateContext, id });

        await carverUser.dispatch({ type: carverUserContext.commonLanguage.commands.Initialize, payload: { id } });

        await withContext(publicState)
            // Proxy all events from a publicState to frontend
            .streamEvents({
                type: '*',

                callback: async (event) => {
                    console.log('forward from publicState:', id, event);
                    forwardEventToSocket(id, event);
                }
            })

    }

    withContext(apiSession)
        .handleQuery(apiSessionContext.commonLanguage.queries.InsertNewUserContext, async (id) => {
            console.log('inserted +');
            await createContexts(id); // Create carverUser and publicState contexts
            await bindStreamsAndInitialize(id); // Then bind them
            console.log('inserted -');

            return {
                id
            }
        })
        .handleStore(apiSessionContext.commonLanguage.storage.FindSessionById, async (id) => {
            console.log('*** active sessions:', apiSessionStateStore.state);
            const newSession = apiSessionStateStore.state.activeSessions.find((activeSession: any) => activeSession.id === id); //@todo move to a query, shouldn't access state of another context directly

            return newSession
        });
}


export default {
    bindContexts
}