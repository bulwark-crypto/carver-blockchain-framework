
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
interface ReservationResponse {
    id: string;
}
interface CommandParams {
    id?: string;
    type: string;
    payload?: any;
}
const initReservationService = ({ loggerDispatch, carverUserDispatch }: Params) => {

    // Private key will allows client to identify themselves uniquely. dispatching commands will require this private key
    // You can tachnically spectate with public key and command with private key
    const privateKey = '@todo';

    const reservationUrl = config.reservations.useWindowHostname ? `//${window.location.hostname}:${config.reservations.port}/` : '/';

    const api = axios.create({
        baseURL: reservationUrl,
        timeout: 1000,
        headers: {
            'authorization': `Basic ${btoa(privateKey)}`,
            'x-carver-framework-version': config.version
        }
    });

    let reservationId = '';

    const addLog = (...args: any) => {
        loggerDispatch({ type: loggerCommonLanguage.commands.Add, payload: args });
    }

    const command = async (params: CommandParams) => {
        addLog(params);
        await api.post('/command', {
            ...params,
            privateKey,
            id: reservationId
        });
    }

    const bindReservation = (id: string, eventSource: EventSource) => { //@todo interface
        reservationId = id;

        /*
        socket.on('connect', () => {
            addLog('Socket connection established successfuly. Welcome to Carver Blockchain Framework!');
        
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
        }*/

        eventSource.onmessage = function (e) {
            const event = JSON.parse(e.data);
            switch (event.type) {
                case carverUserCommonLanguage.events.Updated:
                    carverUserDispatch(event);

                    break;
                default:
                    console.log(event);
                    throw 'Event not found';
            }
        };
        eventSource.onerror = function (e) {
            console.log('**error', e)
        };
        eventSource.onopen = function (e) {
            console.log('**open', e)
        };
    }

    const getEventSource = (reservationResponse: ReservationResponse) => {
        const { id } = reservationResponse;
        const subscriberUrl = config.nchan.useWindowHostname ? `//${window.location.hostname}:${config.nchan.port}/sub/${id}` : `/sub/${id}`;

        var eventSource = new EventSource(subscriberUrl);

        return eventSource;
    }

    const getNewReservation = async () => {
        addLog('Reserving socket connection...');


        const reservationRequest = await api.post('/reserveChannnel')
        return reservationRequest.data;
    }

    return {
        command,
        bindReservation,
        getEventSource,
        getNewReservation
    }
}
export {
    initReservationService
}