import { Context } from '../../../classes/interfaces/context'
import { withState, Reducer } from '../../../classes/logic/withState'

const withCommandInitialize: Reducer = ({ state, event }) => {
    if (state.isInitialized) {
        throw commonLanguage.errors.isAlreadyInitialized;
    }
    const { id } = event.payload;

    return withState(state)
        .set({
            isInitialized: true,
            id
        })
        .query(commonLanguage.queries.GetInitialState);
}
const withQueryGetInitialState: Reducer = ({ state, event }) => {
    const initialWidgetState = event.payload

    return withState(state)
        .emit({
            type: commonLanguage.events.Initialized,
            payload: state // Initial state of the wiget
        });
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.Initialize, event, callback: withCommandInitialize })
        .reduce({ type: commonLanguage.queries.GetInitialState, event, callback: withQueryGetInitialState });
}

const commonLanguage = {
    commands: {
        Initialize: 'INITIALIZE'
    },
    queries: {
        GetInitialState: 'GET_INITIAL_STATE'
    },
    events: {
        Initialized: 'INITIALIZED'
    },
    errors: {
        isAlreadyInitialized: 'You can only initialize state once'
    }
}

const initialState = {
    variant: 'blocks',
    display: 'keyValue'
}

export default {
    initialState,
    reducer,
    commonLanguage
}