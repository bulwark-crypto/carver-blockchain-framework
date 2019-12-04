import { Context } from '../../classes/interfaces/context'
import { withState, Reducer } from '../../classes/logic/withState'

const withRequestAppInitialize: Reducer = ({ state }) => {
    if (state.isInitialized) {
        throw commonLanguage.errors.IS_ALREADY_INITIALIZED;
    }
    return withState(state).set({ isInitialized: true }).emit(commonLanguage.events.INITIALIZED);
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.INITIALIZE, event, callback: withRequestAppInitialize });
}

const commonLanguage = {
    commands: {
        INITIALIZE: 'INITIALIZE'
    },
    events: {
        INITIALIZED: 'INITIALIZED'
    },
    errors: {
        IS_ALREADY_INITIALIZED: 'You can only initialize state once'
    }
}

const initialState = {}

export default {
    initialState,
    reducer,
    commonLanguage
}