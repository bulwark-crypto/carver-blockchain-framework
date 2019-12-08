import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

const withFetchNextTx: Reducer = ({ state, event }) => {
    if (state.isBusyFetchingTxs) {
        return state;
    }

    // Nothing else to fetch
    if (state.txsQueue.length === 0) {
        return state;
    }

    // Request latest tx details
    const { tx, height } = state.txsQueue.shift();

    return withState(state)
        .set({ isBusyFetchingTxs: true })
        .request(commonLanguage.queries.GetRawTransaction, { tx, height })
}

/**
 * Event payload will contain requested tx (in event.payload.response)
 */
const withHandleRequestGetTx: Reducer = ({ state, event }) => {
    const { response, error } = event.payload;
    if (error) {
        throw commonLanguage.errors.unableToFetchTx;
    }

    return withState(state)
        .set({ isBusyFetchingTxs: false })
        .emit(commonLanguage.events.NewTxFound, response) // New tx added
        .reduce({ event, callback: withFetchNextTx })
}
/**
 * Add new txs to fetch
 */
const withRpcNewBlock: Reducer = ({ state, event }) => {
    const { tx: txs, height } = event.payload;

    if (height <= state.height) {
        return state;
    }

    if (height !== state.height + 1) {
        throw commonLanguage.errors.heightMustBeSequential;
    }

    const txsWithHeight = txs.map((tx: any) => ({ tx, height }));


    return withState(state)
        .set({
            height,
            txsQueue: [
                ...state.txsQueue,
                ...txsWithHeight] // The tx queue array will contain a tx and it's associated block
        })
        .reduce({ event, callback: withFetchNextTx })
}
const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.NewBlock, event, callback: withRpcNewBlock })
        .reduce({ type: commonLanguage.queries.GetRawTransaction, event, callback: withHandleRequestGetTx });
}

const commonLanguage = {
    commands: {
        NewBlock: 'NEW_BLOCK'
    },
    events: {
        NewTxFound: 'NEW_TX_FOUND'
    },
    queries: {
        GetRawTransaction: 'GET_RAW_TRANSACTION'
    },
    errors: {
        heightMustBeSequential: 'Blocks must be sent in sequential order',
        unableToFetchTx: 'Unable to fetch TX'
    }
}

const initialState = {
    height: 0,
    txsQueue: [] as any[]
}

export default {
    initialState,
    reducer,
    commonLanguage
}