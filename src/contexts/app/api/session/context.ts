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
        .emit({
            type: commonLanguage.events.SessionReserved,
            payload: newSession
        });
}

const withQueryInsertNewUserContext: Reducer = ({ state, event }) => {
    const { id } = event.payload;

    return withState(state)
        .query(commonLanguage.queries.EmitUserPublicState, { id });
}

const withRequestApiSessionConnect: Reducer = ({ state, event }) => {
    const { id } = event.payload
    console.log('(apiSession) client connected', id);

    return withState(state)
        .query(commonLanguage.queries.InsertNewUserContext, { id });
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.ReserveNewSocket, event, callback: withRequestApiSessionReserveSocket })
        .reduce({ type: commonLanguage.queries.InsertNewUserContext, event, callback: withQueryInsertNewUserContext })
        .reduce({ type: commonLanguage.commands.Connect, event, callback: withRequestApiSessionConnect });
}

const commonLanguage = {
    commands: {
        ReserveNewSocket: 'RESERVE_NEW_SOCKET',
        Connect: 'CONNECT',
    },
    events: {
        SessionReserved: 'SESSION_RESERVED'
    },
    queries: {
        InsertNewUserContext: 'INSERT_NEW_USER_CONTEXT',
        EmitUserPublicState: 'EMIT_USER_PUBLIC_STATE',
    }
}

const initialState = {
    activeSessions: [] as any[]
}

export default {
    initialState,
    reducer,
    commonLanguage
}