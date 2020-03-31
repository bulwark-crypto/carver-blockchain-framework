import { withState, Reducer } from '../../../../classes/logic/withState'

export interface Reservation {
    id: string;
    ip: string;
    frameworkVersion: number;
    privateKey: string;
}

const withCommandReserveSocket: Reducer = ({ state, event }) => {
    const { id, remoteAddress, frameworkVersion, privateKey } = event.payload
    const reservation = { id, remoteAddress, frameworkVersion, privateKey };

    //@todo check reservation against reservations

    return withState(state)
        .set({
            reservations: [
                ...state.reservations,
                reservation
            ]
        })
        .emit({ type: commonLanguage.events.ChannelReserved })
        .query(commonLanguage.queries.CreateSessionContext, { id, privateKey })
}

const withCommandAuthorizeSubscriber: Reducer = ({ state, event }) => {
    console.log('*** auth subscriber:')
    console.log(event);

    return state;
}
const withCommandCarverUser: Reducer = ({ state, event }) => {
    console.log('*** command carver user:', event)
    const { id, type, params } = event.payload;

    return withState(state)
        .emit({ type: commonLanguage.events.CarverUserCommanded, payload: { id, type, params } });
}
const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.ReserveSocket, event, callback: withCommandReserveSocket })
        .reduce({ type: commonLanguage.commands.AuthorizeSubscriber, event, callback: withCommandAuthorizeSubscriber })
        .reduce({ type: commonLanguage.commands.CommandCarverUser, event, callback: withCommandCarverUser });
}

const commonLanguage = {
    type: 'API_REST',
    queries: {
        CreateSessionContext: 'CREATE_SESSION_CONTEXT'
    },
    events: {
        ChannelReserved: 'CHANNEL_RESERVED',
        CarverUserCommanded: 'CARVER_USER_COMMANDED',
    },
    commands: {
        ReserveSocket: 'RESERVE_SOCKET',
        AuthorizeSubscriber: 'AUTHORIZE_SUBSCRIBER', // Called by nchan

        CommandCarverUser: 'COMMAND_CARVER_USER',
    },
    storage: {
        FindStats: 'FIND_STATS'
    },
    errors: {
        UnknownPath: 'UNKNOWN_PATH',
        UnknownReservationError: 'UNKNOWN_RESERVATION_ERROR',
        UnknownSubscriptionError: 'UNKNOWN_SUBSCRIPTION_ERROR',

        IdNotFound: 'ID_NOT_FOUND',
        UnknownCommandException: 'UKNKNOWN_COMMAND_EXCEPTION'
    }
}

const initialState = {
    reservations: [] as Reservation[]
}

export default {
    initialState,
    reducer,
    commonLanguage
}