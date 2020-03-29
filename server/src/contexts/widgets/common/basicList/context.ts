import { withState, Reducer } from '../../../../classes/logic/withState'

const withQueryFindInitialState: Reducer = ({ state, event }) => {
    const { payload: data } = event

    return withState(state)
        .set({
            data
        })
        .emit({
            type: commonLanguage.events.PublicState.Initialized, // Initial public state
            payload: data
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
        .reduce({ type: commonLanguage.queries.FindInitialState, event, callback: withQueryFindInitialState });
}

const commonLanguage = {
    type: 'WIDGET',
    commands: {
        Initialize: 'INITIALIZE',
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
    data: null as any,

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