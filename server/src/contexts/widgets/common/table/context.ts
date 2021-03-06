import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

const withCommandUpdatePage: Reducer = ({ state, event }) => {
    const { page } = event.payload;

    return withState(state)
        .query(commonLanguage.queries.FindPage, { ...state.pageQuery, page })
}

const withCommandUpdateLimit: Reducer = ({ state, event }) => {
    const { limit } = event.payload;

    return withState(state)
        .query(commonLanguage.queries.FindPage, { ...state.pageQuery, limit })
}

const withQueryFindPage: Reducer = ({ state, event }) => {
    const { rows, pageQuery } = event.payload;

    return withState(state)
        .set({
            pageQuery,
            rows
        })
        .emit({
            type: commonLanguage.events.PublicState.Updated, // Public state of the widget was partially updated
            payload: {
                rows,
                pageQuery
            }
        });
}

const withQueryFindInitialState: Reducer = ({ state, event }) => {
    const { rows, count, pageQuery, ...restOfState } = event.payload

    const { hidePagination } = state;

    return withState(state)
        .set({
            rows,
            count
        })
        .emit({
            type: commonLanguage.events.PublicState.Initialized, // Initial public state
            payload: {
                rows,
                pageQuery,
                count,
                hidePagination,
                ...restOfState // Allows to pass in some defining props such as mapType (to explain to client how to display data)
            }
        });
}

const withCommandSetInitialState: Reducer = ({ state, event }) => {
    if (state.isInitialized) {
        throw commonLanguage.errors.isAlreadyInitialized;
    }

    const { filter, sort, findRowByIdCallback, hidePagination } = event.payload;


    return withState(state)
        .set({
            findRowByIdCallback: (findRowByIdCallback ? findRowByIdCallback : state.findRowByIdCallback),
            pageQuery: {
                ...state.pageQuery,
                filter,
                sort
            },
            hidePagination
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

const withCommandSelect: Reducer = ({ state, event }) => {
    const row = state.findRowByIdCallback(state, event.payload.id);

    return withState(state)
        .query(commonLanguage.queries.SelectRow, { row });
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.Initialize, event, callback: withCommandInitialize })
        .reduce({ type: commonLanguage.commands.SetInitialState, event, callback: withCommandSetInitialState })
        .reduce({ type: commonLanguage.commands.UpdatePage, event, callback: withCommandUpdatePage })
        .reduce({ type: commonLanguage.commands.UpdateLimit, event, callback: withCommandUpdateLimit })
        .reduce({ type: commonLanguage.commands.Select, event, callback: withCommandSelect })
        .reduce({ type: commonLanguage.queries.FindPage, event, callback: withQueryFindPage })
        .reduce({ type: commonLanguage.queries.FindInitialState, event, callback: withQueryFindInitialState });
}

const commonLanguage = {
    type: 'WIDGET_COMMON_TABLE',
    commands: {
        Select: 'SELECT',
        Initialize: 'INITIALIZE',
        SetInitialState: 'SET_INITIAL_STATE',
        UpdatePage: 'UPDATE_PAGE',
        UpdateLimit: 'UPDATE_LIMIT',
        UpdateFilter: 'UPDATE_FILTER'
    },
    queries: {
        FindInitialState: 'FIND_INITIAL_STATE',
        FindPage: 'FIND_PAGE',
        SelectRow: 'SELECT_ROW'
    },
    events: {
        PublicState: {
            Initialized: 'INITIALIZED',
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
        limit: 10,
        filter: {},
        sort: null as any
    },
    rows: [] as any[],
    /**
     * You can override and create a custom filter for rows (For example rows can be have nested arrays of data)
     */
    findRowByIdCallback: (state: any, id: string) => {
        return (state.rows as any[]).find((row) => row.id === id);
    },
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