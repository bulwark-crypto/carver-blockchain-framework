import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

const withCheckLatestBlock: Reducer = ({ state, event }) => {
    if (state.height > 100) {
        return state;
    }
    return withState(state)
        .query('GET_BLOCK', state.height + 1); // Request 
}
const withQueryGetBlock: Reducer = ({ state, event }) => {
    const { response, error } = event.payload;

    //@todo also  checkRpcErrors
    if (error) {
        console.log('REQUEST:GET_BLOCK error:', error);
        return state;
    }

    if (response.height !== state.height + 1) {
        throw errors.heightMustBeSequential;
    }

    return withState(state)
        .set({ height: response.height })
        .emit('NEW_BLOCK_REACHED', response)
        .reduce({ event, callback: withCheckLatestBlock });
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: 'RPC_GETINFO:UPDATED', event, callback: withCheckLatestBlock })
        .reduce({ type: 'GET_BLOCK', event, callback: withQueryGetBlock });
}

const errors = {
    heightMustBeSequential: 'Blocks must be sent in sequential order'
}

const initialState = {
    height: 0
}

export default {
    initialState,
    reducer,
    errors
} as Context