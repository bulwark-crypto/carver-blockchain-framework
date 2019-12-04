import { Context } from '../../classes/interfaces/context'
import { withState, Reducer } from '../../classes/logic/withState'

const withInitializeApplication: Reducer = ({ state }) => {
    if (state.isInitialized) {
        throw commonLanguage.errors.IsAlreadyInitialized;
    }
    return withState(state).set({ isInitialized: true }).emit(commonLanguage.events.Initialized);
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.Initialize, event, callback: withInitializeApplication });
}

const commonLanguage = {
    commands: {
        Initialize: 'INITIALIZE'
    },
    events: {
        Initialized: 'INITIALIZED'
    },
    errors: {
        IsAlreadyInitialized: 'You can only initialize state once'
    }
}

const initialState = {}

export default {
    initialState,
    reducer,
    commonLanguage
}