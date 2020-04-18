import { withContext } from '../../../classes/logic/withContext';

import tableContext from '../common/table/context'
import syncRequiredMovementsContext from '../../app/sync/requiredMovements/context'
import carverUserContext, { WidgetBindingParams } from '../../app/carverUser/context'

/**
 * [Shared] We'll ask for some data, how will it be mapped back in the response?
 */
export enum MapType {
    /**
     * These transactions are displayed on "/blocks/XXXXX"
     */
    Block,
    /**
     * These transactions are displayed on "/transactions"
     */
    Transactions
}
interface VariantParams {
    height: number;
    variant: string;
    mapType?: MapType;
}
const bindContexts = async ({ carverUser, carverUserId, contextMap, id, userWidgetsContextStore, variantParams }: WidgetBindingParams) => {
    const { height, variant, mapType }: VariantParams = variantParams;

    const { registeredContext: widget } = await userWidgetsContextStore.register({
        id,
        context: tableContext,
        storeEvents: false,
        inMemory: true
    });

    const filter = height ? { height } : { isReward: false } //@todo I feel like we should have an enum to represent what type of data is being passed in
    await widget.dispatch({ type: tableContext.commonLanguage.commands.SetInitialState, payload: { filter } })

    const appContextStore = await contextMap.getContextStore({ id: 'APP' });
    const syncRequiredMovements = await appContextStore.getRemote({ context: syncRequiredMovementsContext, replyToContext: carverUser });


    // Only return partial getinfo information (Other known fields are not useful)
    const getRowsFromtTxs = (txs: any[]) => {
        return txs.map(({ date, txid, height, txType, totalAmountIn, totalAmountOut, totalCountIn, totalCountOut, amount }: any) => {
            switch (mapType) {
                case MapType.Block:
                    return {
                        id: txid, //@todo id is only temporary until you can specify which key to use for id on frontend tables
                        txid,
                        txType,
                        totalAmountIn,
                        totalAmountOut,
                        totalCountIn,
                        totalCountOut,
                        amount
                    };
                case MapType.Transactions:
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
            }
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
                pageQuery,
                mapType
            }
        })

    return widget;
}

export default {
    bindContexts
}