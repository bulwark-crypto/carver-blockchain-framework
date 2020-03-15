import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

/*
const withCommandReserveNewSession: Reducer = ({ state, event }) => {
    const { payload } = event;
    const { id, remoteAddress, frameworkVersion, privateKey } = payload;

    const newSession = {
        id, remoteAddress, frameworkVersion, privateKey
    }
    const activeSessions = [
        ...state.activeSessions,
        newSession
    ]

    console.log('socket requested', payload);
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

    return withState(state);
}

const withCommandConnect: Reducer = ({ state, event }) => {
    const { id } = event.payload
    console.log('(apiSession) client connected', id);

    return withState(state)
        .query(commonLanguage.queries.InsertNewUserContext, id);
}
*/
const reducer: Reducer = ({ state, event }) => {
    return withState(state)
    //.reduce({ type: commonLanguage.commands.ReserveNewSession, event, callback: withCommandReserveNewSession })
    // .reduce({ type: commonLanguage.commands.Connect, event, callback: withCommandConnect })
    //.reduce({ type: commonLanguage.queries.InsertNewUserContext, event, callback: withQueryInsertNewUserContext })
}

const commonLanguage = {
    type: 'API_SESSIONS',
    commands: {
        ReserveNewSession: 'RESERVE_NEW_SESSION',
        Connect: 'CONNECT',
    },
    events: {
        SessionReserved: 'SESSION_RESERVED',
    },
    queries: {
        InsertNewUserContext: 'INSERT_NEW_USER_CONTEXT',
    },
    storage: {
        FindSessionById: 'FIND_USER_CONTEXT_BY_ID'
    },
    errors: {
        IdNotFound: 'ID_NOT_FOUND'
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