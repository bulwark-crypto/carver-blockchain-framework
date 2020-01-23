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

const withQueryFindBalancesByAddresses: Reducer = ({ state, event }) => {
    const addressBalances = (event.payload as any[])

    const { sequence, height, date } = state;
    const { txType } = state.requiredMovement;

    const getAddressBalanceByLabel = (label: string) => {
        const addressBalance = addressBalances.find(addressBalance => addressBalance.label === label);
        if (addressBalance) {
            return addressBalance;
        }
        return {
            label,
            balance: 0,
            sequence: 0,
            isNew: true
        }
    }

    const newAddressMovements = [] as any[];

    const addressesBalancesToUpdate = [] as any[];
    const addressesBalancesToInsert = [] as any[];

    state.requiredMovement.consolidatedAddressAmounts.forEach((movementData: any) => {
        const { isNew, ...addressBalance } = getAddressBalanceByLabel(movementData.label)

        const balance = addressBalance.balance - movementData.amount;
        const { label } = addressBalance

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

        const fieldsToUpdate = {
            sequence,
            balance
        } as any

        if (isNew) {
            addressesBalancesToInsert.push({
                ...addressBalance,
                ...fieldsToUpdate
            })
        } else {
            addressesBalancesToUpdate.push({
                label,
                fields: fieldsToUpdate
            });
        }
    });

    return withState(state)
        .store(commonLanguage.storage.UpdateAddressBalances, addressesBalancesToUpdate)
        .store(commonLanguage.storage.InsertManyAddressBalances, addressesBalancesToInsert)
        .store(commonLanguage.storage.InsertManyAddressMovements, newAddressMovements)

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