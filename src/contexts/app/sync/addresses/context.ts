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
        })
        .query(commonLanguage.queries.FindByLabels, labels)
}

const withQueryFindByLabels: Reducer = ({ state, event }) => {
    const { txType, addressType } = state.requiredMovement;

    const addresses = (event.payload as any[])

    const getAddressByLabel = (label: string) => {
        const address = addresses.find(address => address.label === label);
        if (address) {
            return address;
        }
        return {
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
            isNew: true
        }
    }

    let addressesToInsert = [] as any[];
    let addressesToUpdate = [] as any[];

    state.requiredMovement.consolidatedAddressAmounts.forEach((movementData: any) => {
        const { label } = movementData;
        const { isNew, ...address } = getAddressByLabel(label)

        if (!address) {
            throw `Could not find address: ${label}`
        }

        // Do not update address if this sequence was already parsed
        if (address.sequence >= state.sequence) {
            return;
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


        if (isNew) {
            addressesToInsert.push({
                ...address,
                ...fieldsToUpdate
            })
        } else {
            addressesToUpdate.push({
                label,
                fields: fieldsToUpdate
            });
        }
    })


    return withState(state)
        .store(commonLanguage.storage.InsertMany, addressesToInsert)
        .store(commonLanguage.storage.UpdateMany, addressesToUpdate)
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
        RequiredMovementParsed: 'REQUIRED_MOVEMENT_PARSED'
    },
    queries: {
        FindByLabels: 'FIND_BY_LABELS'
    },
    storage: {
        InsertMany: 'INSERT_MANY',
        UpdateMany: 'UPDATE_MANY'
    },
    errors: {
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