import { withContext } from '../../../classes/logic/withContext';
import { ContextStore } from '../../../classes/contexts/contextStore';

import tableContext from '../common/table/context'
import rpcBlocksContext from '../../app/rpc/blocks/context'
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
    const rpcBlocks = await appContextStore.getRemote({ context: rpcBlocksContext, replyToContext: carverUser });

    // Only return partial getinfo information (Other known fields are not useful)
    const getRowsFromBlocks = (blocks: any[]) => {
        return blocks.map(({ height, hash, date, tx, moneysupply }: any) => {
            return {
                id: height, //@todo id is only temporary until you can specify which key to use for id on frontend tables
                height,
                hash,
                txsCount: tx.length,
                date,
                moneysupply
            };
        });
    }

    withContext(tableWidget)
        .handleQuery(tableContext.commonLanguage.queries.FindPage, async (pageQuery) => {
            const blocks = await rpcBlocks.queryStorage(rpcBlocksContext.commonLanguage.storage.FindManyByPage, pageQuery);
            const rows = getRowsFromBlocks(blocks);

            return {
                rows,
                pageQuery
            };
        })
        .handleQuery(tableContext.commonLanguage.queries.SelectRow, async ({ row }) => {
            console.log('--select:', row);
            await carverUser.dispatch({ type: carverUserContext.commonLanguage.commands.Pages.Navigate, payload: { page: 'block' } })
        })
        .handleQuery(tableContext.commonLanguage.queries.FindInitialState, async (pageQuery) => {
            const pageQueryNoRewards = { ...pageQuery, isReward: false };

            const count = await rpcBlocks.queryStorage(rpcBlocksContext.commonLanguage.storage.FindCount, pageQueryNoRewards);
            const blocks = await rpcBlocks.queryStorage(rpcBlocksContext.commonLanguage.storage.FindManyByPage, pageQueryNoRewards);
            const rows = getRowsFromBlocks(blocks);

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