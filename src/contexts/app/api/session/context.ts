import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

const withRequestApiSessionReserveSocket: Reducer = ({ state, event }) => {
    const { payload } = event;
    const { id, sourceIdentifier } = payload;

    const newSession = {
        id,
        reservation: {
            websocketEndpoint: `http://localhost:5000/` //@todo add config
        },
        source: {
            identifier: sourceIdentifier
        }
    }
    const activeSessions = [
        ...state.activeSessions,
        newSession
    ]

    console.log('socket requested', activeSessions);
    return withState(state)
        .set({
            activeSessions
        })
        .emit('API:SESSION:NEW', newSession);
}

const withRequestApiSessionConnect: Reducer = ({ state, event }) => {
    const { id } = event.payload
    console.log('(apiSession) client connected', id);

    return withState(state).request('REQUEST:NEW_USER_CONTEXT', { id });
}
const withRequestApiSessionEmit: Reducer = ({ state, event }) => {
    const { id } = event.payload;

    console.log('(apiSession) emit', id, event);
    return state;
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: 'REQUEST:API:SESSION:RESERVE_SOCKET', event, callback: withRequestApiSessionReserveSocket })
        .reduce({ type: 'REQUEST:API:SESSION:CONNECT', event, callback: withRequestApiSessionConnect })
        .reduce({ type: 'REQUEST:API:SESSION:EMIT', event, callback: withRequestApiSessionEmit });
}

const errors = {
}

const initialState = {
    activeSessions: [] as any[]
}

export default {
    initialState,
    reducer,
    errors
} as Context