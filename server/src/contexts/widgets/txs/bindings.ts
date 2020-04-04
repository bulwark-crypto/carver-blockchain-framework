import { withContext } from '../../../classes/logic/withContext';

import tableContext from '../common/table/context'
import syncRequiredMovementsContext from '../../app/sync/requiredMovements/context'
import carverUserContext, { WidgetBindingParams } from '../../app/carverUser/context'

const bindContexts = async ({ carverUser, carverUserId, contextMap, id, userWidgetsContextStore, variantParams }: WidgetBindingParams) => {
    const { height, variant } = variantParams;

    const { registeredContext: widget } = await userWidgetsContextStore.register({
        id,
        context: tableContext,
        storeEvents: false,
        inMemory: true
    });

    const filter = height ? { height } : { isReward: false }
    await widget.dispatch({ type: tableContext.commonLanguage.commands.SetInitialState, payload: { filter } })

    const appContextStore = await contextMap.getContextStore({ id: 'APP' });
    const syncRequiredMovements = await appContextStore.getRemote({ context: syncRequiredMovementsContext, replyToContext: carverUser });


    // Only return partial getinfo information (Other known fields are not useful)
    const getRowsFromtTxs = (txs: any[]) => {
        return txs.map(({ date, txid, height, txType, totalAmountIn, totalAmountOut, totalCountIn, totalCountOut }: any) => {
            return {
                id: txid, //@todo id is only temporary until you can specify which key to use for id on frontend tables
                date,
                txid,
                height,
                txType,
                totalAmountIn,
                totalAmountOut,
                totalCountIn,
                totalCountOut
            };
        });
    }

    withContext(widget)
        .handleQuery(tableContext.commonLanguage.queries.FindPage, async (pageQuery) => {
            const txs = await syncRequiredMovements.queryStorage(syncRequiredMovementsContext.commonLanguage.storage.FindManyByPage, pageQuery);
            const rows = getRowsFromtTxs(txs);

            return {
                rows,
                pageQuery
            };
        })
        .handleQuery(tableContext.commonLanguage.queries.SelectRow, async ({ row }) => {
            const { txid } = row;
            await carverUser.dispatch({ type: carverUserContext.commonLanguage.commands.Pages.Navigate, payload: { page: 'tx', txid } })
        })
        .handleQuery(tableContext.commonLanguage.queries.FindInitialState, async (pageQuery) => {
            const count = await syncRequiredMovements.queryStorage(syncRequiredMovementsContext.commonLanguage.storage.FindCount, pageQuery);
            const txs = await syncRequiredMovements.queryStorage(syncRequiredMovementsContext.commonLanguage.storage.FindManyByPage, pageQuery);
            const rows = getRowsFromtTxs(txs);

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