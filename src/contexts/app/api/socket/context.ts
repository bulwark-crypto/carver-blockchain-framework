import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

const withContinueInitialized: Reducer = ({ state }) => {
    if (state.isInitialized) {
        throw commonLanguage.isAlreadyInitialized;
    }
    return withState(state).set({ isInitialized: true }).emit('APP:INITIALIZED');
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: 'CONTINUE:INITIALIZE', event, callback: withContinueInitialized });
}

const commonLanguage = {
    isAlreadyInitialized: 'You can only initialize state once'
}

const initialState = {}

export default {
    initialState,
    reducer,
    commonLanguage
} as Context