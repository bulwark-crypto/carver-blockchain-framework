import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

const withCommandUpdatePage: Reducer = ({ state, event }) => {
    const { page } = event.payload;
    const { limit } = state.pageQuery;

    return withState(state)
        .query(commonLanguage.queries.FindPage, { page, limit })
}

const withCommandUpdateLimit: Reducer = ({ state, event }) => {
    const { limit } = event.payload;
    const { page } = state.pageQuery;

    return withState(state)
        .query(commonLanguage.queries.FindPage, { page, limit })
}

const withQueryFindPage: Reducer = ({ state, event }) => {
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

const withQueryFindRows: Reducer = ({ state, event }) => {
    const { rows, count } = event.payload

    return withState(state)
        .set({
            rows,
            count
        })
}

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
        .query(commonLanguage.queries.FindRows, state.pageQuery); // When context is initialized 
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.Initialize, event, callback: withCommandInitialize })
        .reduce({ type: commonLanguage.commands.UpdatePage, event, callback: withCommandUpdatePage })
        .reduce({ type: commonLanguage.commands.UpdateLimit, event, callback: withCommandUpdateLimit })
        .reduce({ type: commonLanguage.queries.FindPage, event, callback: withQueryFindPage })
        .reduce({ type: commonLanguage.queries.FindRows, event, callback: withQueryFindRows });
}

const commonLanguage = {
    commands: {
        Initialize: 'INITIALIZE',
        UpdatePage: 'UPDATE_PAGE',
        UpdateLimit: 'UPDATE_LIMIT',
    },
    queries: {
        FindRows: 'FIND_ROWS',
        FindPage: 'FIND_PAGE',
    },
    events: {
        Intialized: 'INTIALIZED',
        StateUpdated: 'STATE_UPDATED',
    },
    storage: {
        FindPublicState: 'FIND_PUBLIC_STATE'
    },
    errors: {
        isAlreadyInitialized: 'You can only initialize state once'
    }
}

const initialState = {
    pageQuery: {
        page: 0,
        limit: 10
    },
    rows: [] as any[],
    count: 0,

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