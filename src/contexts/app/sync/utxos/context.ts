import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

/**
 * Add new txs to fetch
 */
const withCommandParseTx: Reducer = ({ state, event }) => {
    console.log('@todo extract utxo from addressLabel + block height', event.payload)
    return state;

}
const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.ParseTx, event, callback: withCommandParseTx });
}

const commonLanguage = {
    commands: {
        ParseTx: 'PARSE_TX'
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