import { withState, Reducer } from '../../../../classes/logic/withState'

const reducer: Reducer = ({ state, event }) => {
    console.log('++ publicState', event);
    return withState(state)
}

const commonLanguage = {
    commands: {
        Initialize: 'INITIALIZE'
    }
}

const initialState = {}

export default {
    initialState,
    reducer,
    commonLanguage
}