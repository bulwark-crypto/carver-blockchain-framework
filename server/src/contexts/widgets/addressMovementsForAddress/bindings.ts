import { withContext } from '../../../classes/logic/withContext';

import tableContext from '../common/table/context'
import addressMovementsContext from '../../app/sync/addressMovements/context'
import carverUserContext, { WidgetBindingParams } from '../../app/carverUser/context'

interface VariantParams {
    label: string;
    variant: string;
}
const bindContexts = async ({ carverUser, contextMap, id, userWidgetsContextStore, variantParams }: WidgetBindingParams) => {
    const { label }: VariantParams = variantParams;

    const { registeredContext: widget } = await userWidgetsContextStore.register({
        id,
        context: tableContext,
        storeEvents: false,
        inMemory: true
    });

    await widget.dispatch({
        type: tableContext.commonLanguage.commands.SetInitialState, payload: {
            filter: {
                label
            },
            sort: {
                label: 1,
                _id: -1
            }
        }
    })

    const appContextStore = await contextMap.getContextStore({ id: 'APP' });
    const addressMovements = await appContextStore.getRemote({ context: addressMovementsContext, replyToContext: carverUser });


    // Only return partial getinfo information (Other known fields are not useful)
    const getAddressMovements = (addressMovements: any[]) => {
        return addressMovements
            .map(({ _id, sequence, amountIn, balance, isReward, amountOut, date, txid }: any) => {
                return {
                    id: _id, //@todo id is only temporary until you can specify which key to use for id on frontend tables
                    amountIn,
                    amountOut,
                    date,
                    txid,
                    balance,
                    isReward
                };
            });
    }

    withContext(widget)
        .handleQuery(tableContext.commonLanguage.queries.SelectRow, async ({ row }) => {
            const { txid } = row;
            await carverUser.dispatch({ type: carverUserContext.commonLanguage.commands.Pages.Navigate, payload: { page: 'tx', txid } });
        })
        .handleQuery(tableContext.commonLanguage.queries.FindPage, async (pageQuery) => {
            const queriedAddressMovements = await addressMovements.queryStorage(addressMovementsContext.commonLanguage.storage.FindManyByPage, pageQuery);

            const rows = getAddressMovements(queriedAddressMovements);

            return {
                rows,
                pageQuery
            }
        })
        .handleQuery(tableContext.commonLanguage.queries.FindInitialState, async (pageQuery) => {
            const queriedAddressMovements = await addressMovements.queryStorage(addressMovementsContext.commonLanguage.storage.FindManyByPage, pageQuery);
            const count = await addressMovements.queryStorage(addressMovementsContext.commonLanguage.storage.FindCount, pageQuery);

            const rows = getAddressMovements(queriedAddressMovements);

            return {
                rows,
                count,
                pageQuery
            }
        })

    return widget;
}

export default {
    bindContexts
}