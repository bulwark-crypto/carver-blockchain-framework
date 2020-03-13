
import io from 'socket.io-client';
import axios from 'axios'
import { config } from '../../config'
import { commonLanguage as carverUserCommonLanguage } from './contexts/publicState/context'
import { reducer as loggerReducer, initialState as loggerInitialState, commonLanguage as loggerCommonLanguage } from './contexts/logger/context'
import { Event } from './interfaces'

interface Params {
    carverUserDispatch: React.Dispatch<Event>;
    loggerDispatch: React.Dispatch<Event>;
}
const initReservationService = ({ loggerDispatch, carverUserDispatch }: Params) => {

    const addLog = (...args: any) => {
        loggerDispatch({ type: loggerCommonLanguage.commands.Add, payload: args });
    }

    const bindReservation = (socket: SocketIOClient.Socket) => { //@todo interface
        addLog('Connecting to socket server...', (socket as any).query);

        socket.on('connect', () => {
            addLog('Socket connection established successfuly. Welcome to Carver Blockchain Framework!');
            /*
            socket.emit('emit', {
                type: carverUserCommonLanguage.commands.Connect
            })*/
        });

        socket.on('disconnect', () => {
            addLog('Socket disconnected...');
        });


        // Forward public state events to the reducer
        const eventsToForwardToReducer = [
            carverUserCommonLanguage.events.Updated,

        ];
        for (const eventToForwardToReducer of eventsToForwardToReducer) {
            socket.on(eventToForwardToReducer, (event: any) => {
                const eventToDispatch = {
                    ...event
                };
                carverUserDispatch(eventToDispatch);

                addLog('Dispatch:', eventToDispatch);
            });
        }
    }

    const getSocket = (reservationResponse: any) => { //@todo interface
        const { id, reservation } = reservationResponse;
        const { websocketEndpoint } = reservation

        const socket = io(websocketEndpoint, {
            query: { id }
        });
        return socket;
    }

    const getNewReservation = async () => {
        addLog('Reserving socket connection...');

        // Private key will allows client to identify themselves uniquely. dispatching commands will require this private key
        // You can tachnically spectate with public key and command with private key
        const privateKey = '@todo';

        const api = axios.create({
            baseURL: config.reservations.endpoint,
            timeout: 1000,
            headers: {
                'authorization': `Basic ${btoa(privateKey)}`,
                'x-carver-framework-version': config.version
            }
        });

        const reservationRequest = await api.post('/reserveChannnel')
        return reservationRequest.data;
    }

    return {
        bindReservation,
        getSocket,
        getNewReservation
    }
}
export {
    initReservationService
}