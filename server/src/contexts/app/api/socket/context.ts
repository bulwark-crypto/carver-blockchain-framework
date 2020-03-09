import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
}

const commonLanguage = {
    type: 'API_SOCKET'
}

const initialState = {}

export default {
    initialState,
    reducer,
    commonLanguage
} as Context