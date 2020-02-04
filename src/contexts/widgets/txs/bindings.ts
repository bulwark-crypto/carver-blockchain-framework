import { withContext } from '../../../classes/logic/withContext';
import { ContextStore } from '../../../classes/contextStore';

import blocksWidgetContext from '../common/table/context'
import rpcTxsContext from '../../app/rpc/txs/context'

const bindContexts = async (contextStore: ContextStore, id: string) => {
    const blocksWidget = await contextStore.get(blocksWidgetContext, id);

    // Since widgets are created in 'USER' contextStore, we need to get access to 'CORE' contextStore to fetch projected data
    const coreContextStore = await contextStore.getParent('CORE');
    const rpcTxs = await coreContextStore.get(rpcTxsContext);

    // Only return partial tx information (Other known fields are not useful)
    const getRowsFromTxs = (txs: any[]) => {
        return txs.map((tx: any) => {
            return {
                id: tx.txid, //@todo id is only temporary until you can specify which key to use for id on frontend tables
                txid: tx.txid,
                height: tx.height
            };
        });
    }

    withContext(blocksWidget)
        .handleQuery(blocksWidgetContext.commonLanguage.queries.GetPage, async (pageQuery) => {
            const txs = await rpcTxs.query(rpcTxsContext.commonLanguage.storage.FindManyByPage, pageQuery);
            const rows = getRowsFromTxs(txs);

            return {
                rows,
                pageQuery
            };
        })
        .handleQuery(blocksWidgetContext.commonLanguage.queries.GetRows, async (pageQuery) => {
            const count = await rpcTxs.query(rpcTxsContext.commonLanguage.storage.FindCount, pageQuery);
            const txs = await rpcTxs.query(rpcTxsContext.commonLanguage.storage.FindManyByPage, pageQuery);
            const rows = getRowsFromTxs(txs);

            return {
                rows,
                count
            }
        });
}

export default {
    bindContexts
}