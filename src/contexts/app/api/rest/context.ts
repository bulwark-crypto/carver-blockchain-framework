import { withState, Reducer } from '../../../../classes/logic/withState'

export interface Reservation {
    id: string;
    remoteAddress: string;
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
        .query(commonLanguage.queries.CreateSessionContext, reservation)
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.ReserveSocket, event, callback: withCommandReserveSocket })
}

const commonLanguage = {
    type: 'API_REST',
    queries: {
        CreateSessionContext: 'CREATE_SESSION_CONTEXT'
    },
    commands: {
        ReserveSocket: 'RESERVE_SOCKET'
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