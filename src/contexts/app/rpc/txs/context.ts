import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

const withFetchNextTx: Reducer = ({ state, event }) => {
    // Nothing else to fetch
    if (state.txsQueue.length === 0) {
        return state;
    }

    // Request latest tx details
    const payload = state.txsQueue.shift();

    return withState(state)
        .query(commonLanguage.queries.GetRawTransaction, payload)
}

/**
 * Event payload will contain requested tx (in event.payload.response)
 */
const withHandleRequestGetTx: Reducer = ({ state, event }) => {
    const { rpcTx, height, sequence } = event.payload;

    return withState(state)
        .store(commonLanguage.storage.InsertOne, {
            ...rpcTx,
            height,
            sequence
        })
        .emit({
            type: commonLanguage.events.NewTxFound,
            payload: rpcTx.txid
        })
        .reduce({ event, callback: withFetchNextTx })
}
/**
 * Add new txs to fetch
 */
const withParseBlock: Reducer = ({ state, event }) => {
    const block = event.payload;
    const { tx: txs, height } = block;

    if (height <= state.height) {
        return state;
    }

    if (height !== state.height + 1) {
        throw commonLanguage.errors.heightMustBeSequential;
    }


    const newTxsQueue = txs.map((txid: string) => ({ txid, height, sequence: event.sequence }));

    return withState(state)
        .set({
            height,
            txsQueue: [
                ...state.txsQueue,
                ...newTxsQueue] // The tx queue array will contain a tx and it's associated height. It will also contain the block sequence (for resuming purposes)
        })
        .reduce({ event, callback: withFetchNextTx })
}
const withCommandInitialize: Reducer = ({ state, event }) => {
    const { height } = event.payload;

    return withState(state)
        .set({ height })
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.Initialize, event, callback: withCommandInitialize })
        .reduce({ type: commonLanguage.commands.ParseBlock, event, callback: withParseBlock })
        .reduce({ type: commonLanguage.queries.GetRawTransaction, event, callback: withHandleRequestGetTx });
}

const commonLanguage = {
    commands: {
        Initialize: 'INITIALIZE',
        ParseBlock: 'PARSE_BLOCK'
    },
    events: {
        NewTxFound: 'NEW_TX_FOUND'
    },
    queries: {
        GetRawTransaction: 'GET_RAW_TRANSACTION'
    },
    storage: {
        InsertOne: 'INSERT_ONE',
        GetByHeight: 'GET_BY_HEIGHT',
        GetOneByTxId: 'GET_ONE_BY_TX_ID'
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