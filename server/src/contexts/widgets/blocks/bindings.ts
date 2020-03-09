import { withContext } from '../../../classes/logic/withContext';
import { ContextStore } from '../../../classes/contexts/contextStore';

import tableContext from '../common/table/context'
import rpcBlocksContext from '../../app/rpc/blocks/context'
import carverUserContext from '../../app/carverUser/context'

const bindContexts = async (contextStore: ContextStore, carverUserId: string, id: string) => {
    const tableWidget = await contextStore.get(tableContext, id);

    // Each widget has access to the user that is displaying this widget. Allowing us to easily navigate between pages and add additional widgets on a page.
    const carverUserContextStore = await contextStore.getParent('SESSIONS');
    const carverUser = await carverUserContextStore.get(carverUserContext, carverUserId);

    // Since widgets are created in 'USER' contextStore, we need to get access to 'CORE' contextStore to fetch projected data
    const coreContextStore = await contextStore.getParent('CORE');
    const rpcBlocks = await coreContextStore.get(rpcBlocksContext);

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
            const blocks = await rpcBlocks.query(rpcBlocksContext.commonLanguage.storage.FindManyByPage, pageQuery);
            const rows = getRowsFromBlocks(blocks);

            return {
                rows,
                pageQuery
            };
        })
        .handleQuery(tableContext.commonLanguage.queries.SelectRow, async ({ row }) => {
            await carverUser.dispatch({ type: carverUserContext.commonLanguage.commands.Widgets.Add, payload: { variant: 'blocks' } })
            console.log('blocks:', row, 'carverUser:', carverUser, 'carverUserId:', carverUserId);
        })
        .handleQuery(tableContext.commonLanguage.queries.FindInitialState, async (pageQuery) => {
            const pageQueryNoRewards = { ...pageQuery, isReward: false };

            const count = await rpcBlocks.query(rpcBlocksContext.commonLanguage.storage.FindCount, pageQueryNoRewards);
            const blocks = await rpcBlocks.query(rpcBlocksContext.commonLanguage.storage.FindManyByPage, pageQueryNoRewards);
            const rows = getRowsFromBlocks(blocks);

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