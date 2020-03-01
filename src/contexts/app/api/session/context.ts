import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

const withCommandReserveNewSession: Reducer = ({ state, event }) => {
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

    console.log('socket requested', newSession);
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

const withRequestApiSessionConnect: Reducer = ({ state, event }) => {
    const { id } = event.payload
    console.log('(apiSession) client connected', id);

    return withState(state)
        .query(commonLanguage.queries.InsertNewUserContext, id);
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.ReserveNewSession, event, callback: withCommandReserveNewSession })
        .reduce({ type: commonLanguage.queries.InsertNewUserContext, event, callback: withQueryInsertNewUserContext })
        .reduce({ type: commonLanguage.commands.Connect, event, callback: withRequestApiSessionConnect });
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