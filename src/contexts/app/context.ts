import { Context } from '../../classes/interfaces/context'
import { withState, Reducer } from '../../classes/logic/withState'

const withCommandInitialize: Reducer = ({ state, event }) => {
    if (state.isInitialized) {
        throw commonLanguage.errors.IsAlreadyInitialized;
    }
    return withState(state)
        .set({ isInitialized: true })
        .emit({
            type: commonLanguage.events.Initialized
        });
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.Initialize, event, callback: withCommandInitialize });
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