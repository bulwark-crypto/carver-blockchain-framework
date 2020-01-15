import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

/**
 * Ensure the required addresses are 
 */
const withCommandParseRequiredMovements: Reducer = ({ state, event }) => {
    const requiredMovements = event.payload;

    const labels = (requiredMovements.consolidatedAddressAmounts as any[]).map(consolidatedAddressAmount => consolidatedAddressAmount.label)

    return withState(state)
        .set({ labels })
        .query(commonLanguage.queries.FindByLabels, labels)
}
const withQueryFindByLabels: Reducer = ({ state, event }) => {
    const addresses = event.payload;

    console.log('find by labels:', state.labels, addresses)

    return state
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.queries.FindByLabels, event, callback: withQueryFindByLabels })
        .reduce({ type: commonLanguage.commands.ParseRequiredMovements, event, callback: withCommandParseRequiredMovements });
}

const commonLanguage = {
    commands: {
        ParseRequiredMovements: 'PARSE_REQUIRED_MOVEMENTS'
    },
    events: {
        AddressCreated: 'ADDRESS_CREATED'
    },
    queries: {
        FindByLabels: 'FIND_BY_LABELS'
    },
    errors: {
        heightMustBeSequential: 'Blocks must be sent in sequential order',
        unableToFetchTx: 'Unable to fetch TX',
        noTxVout: 'Unsupported transaction. (No vout[]).'
    }
}

const initialState = {
    height: 0,
    cache: [] as any[]
}

export default {
    initialState,
    reducer,
    commonLanguage
}