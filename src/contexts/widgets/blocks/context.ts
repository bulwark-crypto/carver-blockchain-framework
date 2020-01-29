import { Context } from '../../../classes/interfaces/context'
import { withState, Reducer } from '../../../classes/logic/withState'

const withCommandInitialize: Reducer = ({ state, event }) => {
    if (state.isInitialized) {
        throw commonLanguage.errors.isAlreadyInitialized;
    }
    const { type, payload } = event;
    const { id, variant } = payload;

    return withState(state)
        .set({
            isInitialized: true,
            id,
            variant
        })
        .query(commonLanguage.queries.GetInitialState);
}
const withQueryGetInitialState: Reducer = ({ state, event }) => {
    const initialWidgetState = event.payload

    return withState(state)
        .emit({
            type: commonLanguage.events.Intialized,
            payload: initialWidgetState
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
        Intialized: 'INTIALIZED'
    },
    errors: {
        isAlreadyInitialized: 'You can only initialize state once'
    }
}

const initialState = {
    display: 'keyValue'
}

export default {
    initialState,
    reducer,
    commonLanguage
}