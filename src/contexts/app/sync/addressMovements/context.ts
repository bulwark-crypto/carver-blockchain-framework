import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'
import { CarverTxType, CarverAddressType } from '../../../../classes/interfaces/carver'

const withCommandParseRequiredMovement: Reducer = ({ state, event }) => {
    const { requiredMovement, height } = event.payload;
    const { sequence } = event;

    const labels = (requiredMovement.consolidatedAddressAmounts as any[]).map(consolidatedAddressAmount => consolidatedAddressAmount.label)

    return withState(state)
        .set({
            requiredMovement,
            height,
            sequence,
            addresses: []
        })
    //.query(commonLanguage.queries.FindByLabels, labels)
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        //.reduce({ type: commonLanguage.queries.FindByLabels, event, callback: withQueryFindByLabels })
        .reduce({ type: commonLanguage.commands.ParseRequiredMovement, event, callback: withCommandParseRequiredMovement });
}

const commonLanguage = {
    commands: {
        ParseRequiredMovement: 'PARSE_REQUIRED_MOVEMENT'
    },
    events: {
        AddressCreated: 'ADDRESS_CREATED'
    },
    queries: {
        FindByLabels: 'FIND_BY_LABELS'
    },
    storage: {
        CreateAddresses: 'CREATE_ADDRESSES',
        UpdateFields: 'UPDATE_FIELDS'
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