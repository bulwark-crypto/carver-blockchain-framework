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
            type: commonLanguage.events.PublicState.Updated, // Public state of the widget was partially updated
            payload: {
                rows,
                pageQuery
            }
        });
}

const withQueryFindInitialState: Reducer = ({ state, event }) => {
    const { rows, count, pageQuery } = event.payload

    return withState(state)
        .set({
            rows,
            count
        })
        .emit({
            type: commonLanguage.events.PublicState.Intialized, // Initial public state
            payload: {
                rows,
                pageQuery
            }
        });
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
        .query(commonLanguage.queries.FindInitialState, state.pageQuery); // When context is initialized 
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.Initialize, event, callback: withCommandInitialize })
        .reduce({ type: commonLanguage.commands.UpdatePage, event, callback: withCommandUpdatePage })
        .reduce({ type: commonLanguage.commands.UpdateLimit, event, callback: withCommandUpdateLimit })
        .reduce({ type: commonLanguage.queries.FindPage, event, callback: withQueryFindPage })
        .reduce({ type: commonLanguage.queries.FindInitialState, event, callback: withQueryFindInitialState });
}

const commonLanguage = {
    commands: {
        Initialize: 'INITIALIZE',
        UpdatePage: 'UPDATE_PAGE',
        UpdateLimit: 'UPDATE_LIMIT',
    },
    queries: {
        FindInitialState: 'FIND_INITIAL_STATE',
        FindPage: 'FIND_PAGE',
    },
    events: {
        PublicState: {
            Intialized: 'INTIALIZED',
            Updated: 'UPDATED',
        },
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