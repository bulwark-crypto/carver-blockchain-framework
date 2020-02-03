import { withContext } from '../../../classes/logic/withContext';
import { ContextStore } from '../../../classes/contextStore';

import blocksWidgetContext from './context'
import rpcBlocksContext from '../../app/rpc/blocks/context'

const bindContexts = async (contextStore: ContextStore, id: string) => {
    const blocksWidget = await contextStore.get(blocksWidgetContext, id);

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

    const limit = 10; // How many blocks to fetch per page?

    withContext(blocksWidget)
        .handleQuery(blocksWidgetContext.commonLanguage.queries.GetPage, async (pageQuery) => {
            const blocks = await rpcBlocks.query(rpcBlocksContext.commonLanguage.storage.FindManyByPage, pageQuery);

            const rows = getRowsFromBlocks(blocks);

            return {
                rows,
                pageQuery
            };
        })
        .handleQuery(blocksWidgetContext.commonLanguage.queries.GetInitialState, async () => {
            const { variant, display } = blocksWidget.stateStore.state;

            const pageQuery = { page: 0, limit };

            const count = await rpcBlocks.query(rpcBlocksContext.commonLanguage.storage.FindCount, pageQuery);
            const blocks = await rpcBlocks.query(rpcBlocksContext.commonLanguage.storage.FindManyByPage, pageQuery);

            const rows = getRowsFromBlocks(blocks);

            return {
                rows,
                page: 0, // Start from first page
                count,
                pageQuery,

                configuration: {
                    variant,
                    display
                }
            }
        });
}

export default {
    bindContexts
}