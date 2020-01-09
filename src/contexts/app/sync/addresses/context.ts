import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

/**
 * Ensure the required addresses are 
 */
const withCommandParseRequiredMovements: Reducer = ({ state, event }) => {
    const requiredMovements = event.payload;

    requiredMovements.consolidatedAddressAmounts.forEach((address: any) => {
        //console.log('address:', address);
    })

    return withState(state)
        .emit({
            type: commonLanguage.events.AddressCreated,
            payload: {}
        });

}
const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.ParseRequiredMovements, event, callback: withCommandParseRequiredMovements });
}

const commonLanguage = {
    commands: {
        ParseRequiredMovements: 'PARSE_REQUIRED_MOVEMENTS'
    },
    events: {
        AddressCreated: 'ADDRESS_CREATED'
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