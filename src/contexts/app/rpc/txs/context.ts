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
 * Event payload will contain requested tx (in event.payload.response)
 */
const withHandleRequestGetTx: Reducer = ({ state, event }) => {
    const { response, error } = event.payload;
    if (error) {
        throw commonLanguage.unableToFetchTx;
    }

    return withState(state)
        .set({ isBusyFetchingTxs: false })
        .emit('NEW_TX_FOUND', response) // New tx added
        .reduce({ event, callback: withFetchNextTx })
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
        throw commonLanguage.heightMustBeSequential;
    }


    return withState(state)
        .set({
            height,
            txsQueue: [...state.txsQueue, ...tx] // Add txs from this block to fetch
        })
        .reduce({ event, callback: withFetchNextTx })
}
const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: 'NEW_BLOCK_REACHED', event, callback: withRpcNewBlockReached })
        .reduce({ type: 'REQUEST:GET_TX', event, callback: withHandleRequestGetTx });
}

const commonLanguage = {
    heightMustBeSequential: 'Blocks must be sent in sequential order',
    unableToFetchTx: 'Unable to fetch TX'
}

const initialState = {
    height: 0,
    txsQueue: [] as any[]
}

export default {
    initialState,
    reducer,
    commonLanguage
} as Context