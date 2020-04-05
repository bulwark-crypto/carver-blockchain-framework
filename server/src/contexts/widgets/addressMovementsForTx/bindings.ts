import { withContext } from '../../../classes/logic/withContext';

import tableContext from '../common/table/context'
import addressMovementsContext from '../../app/sync/addressMovements/context'
import carverUserContext, { WidgetBindingParams } from '../../app/carverUser/context'

export enum AddressMovementDirection {
    FromAddress,
    ToAddress
}

interface VariantParams {
    txid: string;
    variant: string;
    direction: AddressMovementDirection;
}
const bindContexts = async ({ carverUser, contextMap, id, userWidgetsContextStore, variantParams }: WidgetBindingParams) => {
    const { txid, direction }: VariantParams = variantParams;

    const { registeredContext: widget } = await userWidgetsContextStore.register({
        id,
        context: tableContext,
        storeEvents: false,
        inMemory: true
    });


    await widget.dispatch({
        type: tableContext.commonLanguage.commands.SetInitialState, payload: {
            filter: {
                txid
            }
        }
    })

    const appContextStore = await contextMap.getContextStore({ id: 'APP' });
    const addressMovements = await appContextStore.getRemote({ context: addressMovementsContext, replyToContext: carverUser });


    // Only return partial getinfo information (Other known fields are not useful)
    const getTxAddressMovements = (addressMovements: any[]) => {
        const filteredTxAddressMovements = direction === AddressMovementDirection.FromAddress ?
            addressMovements.filter(tx => tx.amountOut > 0).map((tx) => ({ ...tx, amount: tx.amountOut })) :
            addressMovements.filter(tx => tx.amountIn > 0).map((tx) => ({ ...tx, amount: tx.amountIn }));

        return filteredTxAddressMovements
            .sort((tx1, tx2) => tx2.amount - tx1.amount)
            .map(({ sequence, label, amount }: any) => {
                return {
                    id: sequence, //@todo id is only temporary until you can specify which key to use for id on frontend tables
                    label,
                    amount
                };
            });
    }

    withContext(widget)

        .handleQuery(tableContext.commonLanguage.queries.SelectRow, async ({ row }) => {
            const { label } = row;
            await carverUser.dispatch({ type: carverUserContext.commonLanguage.commands.Pages.Navigate, payload: { page: 'address', label } })
        })
        .handleQuery(tableContext.commonLanguage.queries.FindInitialState, async (pageQuery) => {
            const queriedAddressMovements = await addressMovements.queryStorage(addressMovementsContext.commonLanguage.storage.FindManyByPage, pageQuery);
            const rows = getTxAddressMovements(queriedAddressMovements);

            return {
                rows,
                count: rows.length,
                pageQuery
            }
        })

    return widget;
}

export default {
    bindContexts
}