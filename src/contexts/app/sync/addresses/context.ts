import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

/**
 * Ensure the required addresses are 
 */
const withCommandParseRequiredMovements: Reducer = ({ state, event }) => {
    const { requiredMovements, height } = event.payload;

    const labels = (requiredMovements.consolidatedAddressAmounts as any[]).map(consolidatedAddressAmount => consolidatedAddressAmount.label)

    return withState(state)
        .set({
            requiredMovements,
            height,
            addresses: []
        })
        .query(commonLanguage.queries.FindByLabels, labels)
}
const withQueryFindByLabels: Reducer = ({ state, event }) => {
    const addresses = (event.payload as any[])

    const newAddresses = (state.requiredMovements.consolidatedAddressAmounts as any[]).reduce((addressesToCreate: any[], consolidatedAddressAmount: any) => {
        const { label, addressType } = consolidatedAddressAmount;

        // Ensure we'll only create new addresses once if they don't exist in addresses
        if (!addresses.some(address => address.label === label) && !addressesToCreate.some(address => address.label === label)) {
            const newCarverAddress = {
                label,
                balance: 0,

                height: state.height,
                //date, //@todo
                addressType,

                /*
                // for stats
                valueOut: 0,
                valueIn: 0,
                countIn: 0,
                countOut: 0,
                */
                sequence: 0,
            };


            return [
                ...addressesToCreate,
                newCarverAddress
            ]
        }

        return addressesToCreate
    }, []) as any[];

    // Create new addresses if there are any and call back to same function once those addresses are created.
    if (newAddresses.length > 0) {
        const newAddressLabels = newAddresses.map((newAddress) => newAddress.label)
        console.log('new addresses:', newAddressLabels)

        return withState(state)
            .set({
                addresses: [...state.addresses, addresses]
            })
            .store(commonLanguage.storage.CreateAddresses, newAddresses)
            .query(commonLanguage.queries.FindByLabels, newAddressLabels)

    }


    return withState(state)
        .set({
            addresses: [...state.addresses, addresses]
        })
    //.reduce({ callback: withQueryFindByLabels })
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
    storage: {
        CreateAddresses: 'CREATE_ADDRESSES'
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