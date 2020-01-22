import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'
import { CarverTxType, CarverAddressType } from '../../../../classes/interfaces/carver'

const withCommandParseRequiredMovement: Reducer = ({ state, event }) => {
    const { requiredMovement, height, date } = event.payload;
    const { sequence } = event;

    const labels = (requiredMovement.consolidatedAddressAmounts as any[]).map(consolidatedAddressAmount => consolidatedAddressAmount.label)

    return withState(state)
        .set({
            requiredMovement,
            date,
            height,
            sequence,
            addressBalances: [],
            labels
        })
        .query(commonLanguage.queries.FindBalancesByLabels, labels)
}

const withProcessAddressMovements: Reducer = ({ state, event }) => {
    const { sequence, height, date } = state;
    const { txType } = state.requiredMovement;

    let addressesToUpdate = [] as any[];
    let newAddressMovements = [] as any[]
    state.requiredMovement.consolidatedAddressAmounts.forEach((movementData: any) => {
        const address = (state.addressBalances as any[]).find(addressBalance => addressBalance.label)

        const balance = address.balance - movementData.amount;
        const { label } = address

        const isReward = txType === CarverTxType.ProofOfWork || txType === CarverTxType.ProofOfStake;

        const addressMovement = {
            date,
            height,

            label,
            txid: state.requiredMovement.txid,
            amountIn: movementData.amountIn,
            amountOut: movementData.amountOut,
            balance,
            sequence,
            //previousAddressMovement: lastMovement,
            isReward
        };
        newAddressMovements.push(addressMovement)

        let fieldsToUpdate = {
            sequence,
            balance
        } as any

        addressesToUpdate.push({
            label,
            fields: fieldsToUpdate
        });
    });

    console.log('addressMovements:', state.height)

    return withState(state)
        .store(commonLanguage.storage.UpdateAddressBalances, addressesToUpdate)
        .store(commonLanguage.storage.InsertManyAddressMovements, newAddressMovements)
}
const withQueryFindBalancesByAddresses: Reducer = ({ state, event }) => {
    const addressBalances = (event.payload as any[])

    const newAddressBalances = (state.requiredMovement.consolidatedAddressAmounts as any[]).reduce((addressesBalancesToCreate: any[], consolidatedAddressAmount: any) => {
        const { label, addressType } = consolidatedAddressAmount;

        // Ensure we'll only create new addresses balances once if they don't exist in addresses
        const existingAddresses = [
            ...state.addressBalances, // existing addresses balances
            ...addressBalances, // address balances we found by labels
            ...addressesBalancesToCreate // new address balances that we'll be created in this reducer
        ]

        if (
            !existingAddresses.some(address => address.label === label)
        ) {
            const addressBalance = {
                label,
                balance: 0,
                sequence: 0,
            };

            return [
                ...addressesBalancesToCreate,
                addressBalance
            ]
        }

        return addressesBalancesToCreate
    }, []) as any[];


    // Create new address balances if there are any and call back to same function once those address balances are created.
    if (newAddressBalances.length > 0) {
        const newAddressLabels = newAddressBalances.map((newAddressBalance) => newAddressBalance.label)

        return withState(state)
            .set({
                addressBalances: [...state.addressBalances, ...addressBalances]
            })
            .store(commonLanguage.storage.InsertManyAddressBalances, newAddressBalances)
            .query(commonLanguage.queries.FindBalancesByLabels, newAddressLabels)

    }

    return withState(state)
        .set({
            addressBalances: [...state.addressBalances, ...addressBalances]
        })
        .reduce({ event, callback: withProcessAddressMovements })

}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.queries.FindBalancesByLabels, event, callback: withQueryFindBalancesByAddresses })
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
        FindBalancesByLabels: 'FIND_BALANCES_BY_LABELS'
    },
    storage: {
        InsertManyAddressBalances: 'INSERT_MANY_ADDRESS_BALANCES',
        UpdateAddressBalances: 'UPDATE_ADDRESS_BALANCES',
        InsertManyAddressMovements: 'INSERT_MANY_ADDRESS_MOVEMENTS'
    },
    errors: {
        heightMustBeSequential: 'Blocks must be sent in sequential order',
        unableToFetchTx: 'Unable to fetch TX',
        noTxVout: 'Unsupported transaction. (No vout[]).',

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