import { withState, Reducer } from '../../../../classes/logic/withState'

const withQueryFindInitialState: Reducer = ({ state, event }) => {
    const stats = event.payload

    return withState(state)
        .set({
            ...stats
        })
        .emit({
            type: commonLanguage.events.PublicState.Initialized, // Initial public state
            payload: {
                ...stats
            }
        });
}
const withCommandUpdate: Reducer = ({ state, event }) => {
    const stats = event.payload

    return withState(state)
        .set({
            ...stats
        })
        .emit({
            type: commonLanguage.events.PublicState.Updated,
            payload: {
                ...stats
            }
        });
}

const withCommandInitialize: Reducer = ({ state, event }) => {
    if (state.isInitialized) {
        //throw commonLanguage.errors.isAlreadyInitialized; //@todo this is commented out for shared widgets. As we add more widgets we'll figure out a good pattern to uncomment this (ex: FindCurrentState)
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
        .query(commonLanguage.queries.FindInitialState); // When context is initialized 
}

/**
 * Basic widget that can be initialized one and keeps internal state that can be updated
 */
const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.Initialize, event, callback: withCommandInitialize })
        .reduce({ type: commonLanguage.commands.Update, event, callback: withCommandUpdate })
        .reduce({ type: commonLanguage.queries.FindInitialState, event, callback: withQueryFindInitialState });
}

const commonLanguage = {
    type: 'WIDGET_COMMON_BASIC_OBJECT',
    commands: {
        Initialize: 'INITIALIZE',
        Update: 'UPDATE'
    },
    queries: {
        FindInitialState: 'FIND_INITIAL_STATE',
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
    isInitialized: false,

    configuration: {
        variant: 'stats',
        display: 'table'
    }
}

export default {
    initialState,
    reducer,
    commonLanguage
}