import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

const withFetchNextTx: Reducer = ({ state, event }) => {
    if (state.isBusyFetchingTxs) {
        console.log('events tx queue', state.txsQueue.length);
        return state;
    }

    // Nothing else to fetch
    if (state.txsQueue.length === 0) {
        return state;
    }

    // Request latest tx details
    const tx = state.txsQueue.shift();

    return withState(state)
        .set({ isBusyFetchingTxs: true })
        .request('REQUEST:GET_TX', tx)
}

/**
 * Add new txs to fetch
 */
const withRpcNewBlockReached: Reducer = ({ state, event }) => {
    const { tx, height } = event.payload;

    if (height <= state.height) {
        return state;
    }

    if (height !== state.height + 1) {
        throw errors.heightMustBeSequential;
    }


    return withState(state)
        .set({
            height,
            txsQueue: [...state.txsQueue, ...tx] // Add txs from this block to fetch
        })
        .reduce({ event, callback: withFetchNextTx })
}
const withHandleRequestGetTx: Reducer = ({ state, event }) => {
    return withState(state)
        .set({ isBusyFetchingTxs: false })
        .reduce({ event, callback: withFetchNextTx })
}
const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: 'RPC_BLOCKS:NEW_BLOCK_REACHED', event, callback: withRpcNewBlockReached })
        .reduce({ type: 'REQUEST:GET_TX', event, callback: withHandleRequestGetTx });
}

const errors = {
    heightMustBeSequential: 'Blocks must be sent in sequential order'
}

const initialState = {
    height: 0,
    txsQueue: [] as any[]
}

export default {
    initialState,
    reducer,
    errors
} as Context