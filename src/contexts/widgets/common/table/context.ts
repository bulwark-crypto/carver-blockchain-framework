import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

const withCommandInitialize: Reducer = ({ state, event }) => {
    if (state.isInitialized) {
        throw commonLanguage.errors.isAlreadyInitialized;
    }
    const { id, variant } = event.payload;

    return withState(state)
        .set({
            isInitialized: true,
            id,
            configuration: {
                ...state.configuration,
                variant
            }
        })
        .query(commonLanguage.queries.GetRows, state.pageQuery);
}
const withCommandUpdatePage: Reducer = ({ state, event }) => {
    const { page } = event.payload;
    const { limit } = state.pageQuery;

    return withState(state)
        .query(commonLanguage.queries.GetPage, { page, limit })
}
const withCommandUpdateLimit: Reducer = ({ state, event }) => {

    const { limit } = event.payload;
    const { page } = state.pageQuery;

    return withState(state)
        .query(commonLanguage.queries.GetPage, { page, limit })
}

const withQueryGetPage: Reducer = ({ state, event }) => {
    const { rows, pageQuery } = event.payload;

    return withState(state)
        .set({ pageQuery })
        .emit({
            type: commonLanguage.events.StateUpdated,
            payload: {
                rows,
                pageQuery
            }
        });
}
const withQueryGetRows: Reducer = ({ state, event }) => {
    const initialState = event.payload

    return withState(state)
        .set({
            ...initialState
        })
        .emit({
            type: commonLanguage.events.Intialized,
            payload: {
                ...state,
                ...initialState  // If state contains any private data we can remove it from emitting here
            }
        });
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.Initialize, event, callback: withCommandInitialize })
        .reduce({ type: commonLanguage.commands.UpdatePage, event, callback: withCommandUpdatePage })
        .reduce({ type: commonLanguage.commands.UpdateLimit, event, callback: withCommandUpdateLimit })
        .reduce({ type: commonLanguage.queries.GetPage, event, callback: withQueryGetPage })
        .reduce({ type: commonLanguage.queries.GetRows, event, callback: withQueryGetRows });
}

const commonLanguage = {
    commands: {
        Initialize: 'INITIALIZE',
        UpdatePage: 'UPDATE_PAGE',
        UpdateLimit: 'UPDATE_LIMIT',
    },
    queries: {
        GetRows: 'GET_ROWS',
        GetPage: 'GET_PAGE',
    },
    events: {
        Intialized: 'INTIALIZED',
        StateUpdated: 'STATE_UPDATED',
    },
    errors: {
        isAlreadyInitialized: 'You can only initialize state once'
    }
}

const initialState = {
    pageQuery: { page: 0, limit: 10 },

    configuration: {
        variant: 'blocks',
        display: 'table'
    }
}

export default {
    initialState,
    reducer,
    commonLanguage
}