import { withContext } from '../../../classes/logic/withContext';

import tableContext from '../common/table/context'
import addressMovementsContext from '../../app/sync/addressMovements/context'
import carverUserContext, { WidgetBindingParams } from '../../app/carverUser/context'

enum AddressMovementDirection {
    FromAddress,
    ToAddress
}

interface VariantParams {
    txid: string;
    variant: string;
    direction: AddressMovementDirection;
}
const bindContexts = async ({ carverUser, contextMap, id, userWidgetsContextStore, variantParams }: WidgetBindingParams) => {
    const { txid }: VariantParams = variantParams;

    const { registeredContext: widget } = await userWidgetsContextStore.register({
        id,
        context: tableContext,
        storeEvents: false,
        inMemory: true
    });


    await widget.dispatch({
        type: tableContext.commonLanguage.commands.SetInitialState, payload: {
            findRowByIdCallback: (state: any, id: string) => {
                const addresses = [
                    ...state.rows.from,
                    ...state.rows.to
                ]
                return addresses.find((address) => address.id === id);
            },
            filter: {
                txid
            },
            hidePagination: true
        }
    })

    const appContextStore = await contextMap.getContextStore({ id: 'APP' });
    const addressMovements = await appContextStore.getRemote({ context: addressMovementsContext, replyToContext: carverUser });


    // Only return partial getinfo information (Other known fields are not useful)
    const getTxAddressMovements = (addressMovements: any[], direction: AddressMovementDirection) => {
        const filteredTxAddressMovements = direction === AddressMovementDirection.FromAddress ?
            addressMovements.filter(tx => tx.amountOut > 0).map((tx) => ({ ...tx, amount: tx.amountOut })) :
            addressMovements.filter(tx => tx.amountIn > 0).map((tx) => ({ ...tx, amount: tx.amountIn }));

        return filteredTxAddressMovements
            .sort((tx1, tx2) => tx2.amount - tx1.amount)
            .map(({ _id, sequence, label, amount }: any) => {
                return {
                    id: _id, //@todo id is only temporary until you can specify which key to use for id on frontend tables
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
            const from = getTxAddressMovements(queriedAddressMovements, AddressMovementDirection.FromAddress);
            const to = getTxAddressMovements(queriedAddressMovements, AddressMovementDirection.ToAddress);

            return {
                rows: {
                    from,
                    to,
                },
                pageQuery
            }
        })

    return widget;
}

export default {
    bindContexts
}