import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

const withContinueInitialized: Reducer = ({ state }) => {
    if (state.isInitialized) {
        throw errors.isAlreadyInitialized;
    }
    return withState(state).set({ isInitialized: true }).emit('APP:INITIALIZED');
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: 'CONTINUE:INITIALIZE', event, callback: withContinueInitialized });
}

const errors = {
    isAlreadyInitialized: 'You can only initialize state once'
}

const initialState = {}

export default {
    initialState,
    reducer,
    errors
} as Context