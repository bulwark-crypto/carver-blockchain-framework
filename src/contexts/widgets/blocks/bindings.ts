import { withContext } from '../../../classes/logic/withContext';
import { ContextStore } from '../../../classes/contextStore';

import blocksWidgetContext from './context'
import rpcBlocksContext from '../../app/rpc/blocks/context'

const bindContexts = async (contextStore: ContextStore, id: string) => {
    const blocksWidget = await contextStore.get(blocksWidgetContext, id);

    // Since widgets are created in 'USER' contextStore, we need to get access to 'CORE' contextStore to fetch projected data
    const coreContextStore = await contextStore.getParent('CORE');
    const rpcBlocks = await coreContextStore.get(rpcBlocksContext);

    //

    const limit = 10; // How many blocks to fetch per page?

    withContext(blocksWidget)
        .handleQuery(blocksWidgetContext.commonLanguage.queries.GetInitialState, async () => {
            const { variant, display } = blocksWidget.stateStore.state;

            const query = { page: 0, limit };

            const pages = await rpcBlocks.query(rpcBlocksContext.commonLanguage.storage.FindCountOfPages, query);
            const blocks = await rpcBlocks.query(rpcBlocksContext.commonLanguage.storage.FindManyByPage, query);

            // Only return partial getinfo information (Other known fields are not useful)
            const data = blocks.map(({ height, hash, date, tx, moneysupply }: any) => {
                return {
                    id: hash,
                    height,
                    hash,
                    txsCount: tx.length,
                    date,
                    moneysupply
                };
            });

            return {
                data,
                pages,
                query,
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