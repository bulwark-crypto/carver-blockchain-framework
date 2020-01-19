import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'
import { CarverTxType, CarverAddressType } from '../../../../classes/interfaces/carver'

/**
 * Ensure the required addresses are 
 */
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
        .query(commonLanguage.queries.FindByLabels, labels)
}

const withProcessAddressMovements: Reducer = ({ state, event }) => {
    const { txType } = event.payload;

    let addressesToUpdate = [] as any[];

    state.requiredMovement.consolidatedAddressAmounts.forEach((movementData: any) => {
        const address = state.addresses.find((stateAddress: any) => stateAddress.label === movementData.label);

        if (!address) {
            throw `Could not find address: ${movementData.label}`
        }

        const isReward = txType === CarverTxType.ProofOfWork || txType === CarverTxType.ProofOfStake;


        // We don't want to count movements to address of the rewards. That way the received/sent balance on address is only for non-reward transactions
        const shouldCountTowardsMovement = !isReward || isReward && address.carverAddressType !== CarverAddressType.Address;

        let fieldsToUpdate = {
            sequence: state.sequence
        } as any

        if (movementData.amountOut > 0) {
            if (shouldCountTowardsMovement) {
                fieldsToUpdate.countOut = address.countOut + 1;
                fieldsToUpdate.valueOut = address.valueOut + movementData.amountOut;
            }

            fieldsToUpdate.balance = address.balance - movementData.amountOut;
        }

        if (movementData.amountIn > 0) {
            if (shouldCountTowardsMovement) {
                fieldsToUpdate.countIn = address.countIn + 1;
                fieldsToUpdate.valueIn = address.valueIn + movementData.amountIn;
            }
            fieldsToUpdate.balance = address.balance + movementData.amountIn;
        }

        addressesToUpdate.push({
            txid: state.requiredMovement.txid,
            fields: fieldsToUpdate
        });
    })

    return withState(state)
        .store(commonLanguage.storage.UpdateFields, addressesToUpdate);
}
const withQueryFindByLabels: Reducer = ({ state, event }) => {
    const addresses = (event.payload as any[])

    const newAddresses = (state.requiredMovement.consolidatedAddressAmounts as any[]).reduce((addressesToCreate: any[], consolidatedAddressAmount: any) => {
        const { label, addressType } = consolidatedAddressAmount;

        // Ensure we'll only create new addresses once if they don't exist in addresses
        if (
            !addresses.some(address => address.label === label) &&
            !state.addresses.some((address: any) => address.label === label) &&
            !addressesToCreate.some(address => address.label === label)
        ) {
            const address = {
                label,
                balance: 0,

                height: state.height,
                //date, //@todo
                addressType,


                // for stats
                valueOut: 0,
                valueIn: 0,
                countIn: 0,
                countOut: 0,

                sequence: 0,
            };

            return [
                ...addressesToCreate,
                address
            ]
        }

        return addressesToCreate
    }, []) as any[];

    // Create new addresses if there are any and call back to same function once those addresses are created.
    if (newAddresses.length > 0) {
        const newAddressLabels = newAddresses.map((newAddress) => newAddress.label)

        return withState(state)
            .set({
                addresses: [...state.addresses, ...addresses]
            })
            .store(commonLanguage.storage.CreateAddresses, newAddresses)
            .query(commonLanguage.queries.FindByLabels, newAddressLabels)

    }


    return withState(state)
        .set({
            addresses: [...state.addresses, ...addresses]
        })
        .reduce({ event, callback: withProcessAddressMovements })
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.queries.FindByLabels, event, callback: withQueryFindByLabels })
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