import { withContext } from '../../../classes/logic/withContext';
import { ContextStore } from '../../../classes/contextStore';

import tableContext from '../common/table/context'
import syncRequiredMovementsContext from '../../app/sync/requiredMovements/context'
import carverUserContext from '../../app/carverUser/context'

const bindContexts = async (contextStore: ContextStore, carverUserId: string, id: string) => {
    const tableWidget = await contextStore.get(tableContext, id);

    // Each widget has access to the user that is displaying this widget. Allowing us to easily navigate between pages and add additional widgets on a page.
    const carverUserContextStore = await contextStore.getParent('SESSIONS');
    const carverUser = await carverUserContextStore.get(carverUserContext, carverUserId);

    // Since widgets are created in 'USER' contextStore, we need to get access to 'CORE' contextStore to fetch projected data
    const coreContextStore = await contextStore.getParent('CORE');
    const syncRequiredMovements = await coreContextStore.get(syncRequiredMovementsContext);

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

    withContext(tableWidget)
        .handleQuery(tableContext.commonLanguage.queries.FindPage, async (pageQuery) => {
            const pageQueryWithFilter = { ...pageQuery, filter: { isReward: false } };

            const txs = await syncRequiredMovements.query(syncRequiredMovementsContext.commonLanguage.storage.FindManyByPage, pageQueryWithFilter);
            const rows = getRowsFromtTxs(txs);

            return {
                rows,
                pageQuery
            };
        })
        .handleQuery(tableContext.commonLanguage.queries.SelectRow, async ({ row }) => {
            await carverUser.dispatch({ type: carverUserContext.commonLanguage.commands.Widgets.Add, payload: { variant: 'txs' } })
            console.log('txs:', row, 'carverUser:', carverUser, 'carverUserId:', carverUserId);
        })
        .handleQuery(tableContext.commonLanguage.queries.FindInitialState, async (pageQuery) => {
            const pageQueryWithFilter = { ...pageQuery, filter: { isReward: false } };

            const count = await syncRequiredMovements.query(syncRequiredMovementsContext.commonLanguage.storage.FindCount, pageQueryWithFilter);
            const txs = await syncRequiredMovements.query(syncRequiredMovementsContext.commonLanguage.storage.FindManyByPage, pageQueryWithFilter);
            const rows = getRowsFromtTxs(txs);

            return {
                rows,
                count,
                pageQuery
            }
        })
}

export default {
    bindContexts
}