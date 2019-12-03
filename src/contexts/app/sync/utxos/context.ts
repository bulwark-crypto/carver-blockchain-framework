import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

/**
 * Add new txs to fetch
 */
const withNewTxFound: Reducer = ({ state, event }) => {
    console.log('@todo extract utxo from addressLabel + block height', event.payload)
    return state;

}
const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: 'NEW_TX_FOUND', event, callback: withNewTxFound });
}

const errors = {
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
    errors
} as Context