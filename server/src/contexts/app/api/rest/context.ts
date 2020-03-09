import { withState, Reducer } from '../../../../classes/logic/withState'

export interface Reservation {
    id: string;
    ip: string;
    frameworkVersion: number;
    privateKey: string;
}

const withCommandReserveSocket: Reducer = ({ state, event }) => {
    const { id, ip, frameworkVersion, privateKey } = event.payload
    const reservation = { id, ip, frameworkVersion, privateKey };

    //@todo check reservation against reservations

    return withState(state)
        .set({
            reservations: [
                ...state.reservations,
                reservation
            ]
        })
        .query(commonLanguage.queries.CreateSessionContext, reservation)
}

const withCommandAuthorizeSubscriber: Reducer = ({ state, event }) => {
    console.log('*** auth subscriber:')
    console.log(event);

    return state;
}
const withCommandAuthorizePublisher: Reducer = ({ state, event }) => {
    console.log('*** auth publisher:')
    console.log(event);

    return state;
}
const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.ReserveSocket, event, callback: withCommandReserveSocket })
        .reduce({ type: commonLanguage.commands.AuthorizeSubscriber, event, callback: withCommandAuthorizeSubscriber })
        .reduce({ type: commonLanguage.commands.AuthorizePublisher, event, callback: withCommandAuthorizePublisher })
}

const commonLanguage = {
    type: 'API_REST',
    queries: {
        CreateSessionContext: 'CREATE_SESSION_CONTEXT'
    },
    commands: {
        ReserveSocket: 'RESERVE_SOCKET',
        AuthorizeSubscriber: 'AUTHORIZE_SUBSCRIBER',
        AuthorizePublisher: 'AUTHORIZE_PUBLISHER',
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