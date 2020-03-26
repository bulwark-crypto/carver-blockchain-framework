import { withContext } from '../../../classes/logic/withContext';

import tableContext from '../common/table/context'
import syncRequiredMovementsContext from '../../app/sync/requiredMovements/context'
import carverUserContext from '../../app/carverUser/context'
import { ContextMap } from '../../../classes/contexts/contextMap';

const bindContexts = async (contextMap: ContextMap, carverUserId: string, id: string) => {
    const userWidgetsContextStore = await contextMap.getContextStore({ id: 'USER_WIDGETS' });
    const { registeredContext: tableWidget } = await userWidgetsContextStore.register({
        id,
        context: tableContext,
        storeEvents: false,
        inMemory: true
    });

    const carverUsersContextStore = await contextMap.getContextStore({ id: 'CARVER_USERS' });;
    const carverUser = await carverUsersContextStore.getLocal({
        context: carverUserContext,
        id: carverUserId
    });

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

    withContext(tableWidget)
        .handleQuery(tableContext.commonLanguage.queries.FindPage, async (pageQuery) => {
            const pageQueryWithFilter = { ...pageQuery, filter: { isReward: false } };

            const txs = await syncRequiredMovements.queryStorage(syncRequiredMovementsContext.commonLanguage.storage.FindManyByPage, pageQueryWithFilter);
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

            const count = await syncRequiredMovements.queryStorage(syncRequiredMovementsContext.commonLanguage.storage.FindCount, pageQueryWithFilter);
            const txs = await syncRequiredMovements.queryStorage(syncRequiredMovementsContext.commonLanguage.storage.FindManyByPage, pageQueryWithFilter);
            const rows = getRowsFromtTxs(txs);

            return {
                rows,
                count,
                pageQuery
            }
        })


    return tableWidget;
}

export default {
    bindContexts
}