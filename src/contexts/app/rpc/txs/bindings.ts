import { RegisteredContext } from '../../../../classes/eventStore';
import { rpc } from '../../../../classes/libs/rpcInstance'
import { withContext } from '../../../../classes/logic/withContext';
import { ContextStore } from '../../../../classes/contextStore';

import rpcTxsContext from './context'
import rpcBlocksContext from '../blocks/context'

const bindContexts = async (contextStore: ContextStore) => {
    const rpcTxs = await contextStore.get(rpcTxsContext);
    const rpcBlocks = await contextStore.get(rpcBlocksContext);

    // Queries to handle
    withContext(rpcTxs)
        .handleRequest(rpcTxsContext.commonLanguage.queries.GetRawTransaction, async (tx) => {
            const rawTransaction = await rpc.call('getrawtransaction', [tx, 1]);
            return rawTransaction
        });

    withContext(rpcBlocks)
        // Proxy event RPC:
        .streamEvents({
            type: rpcBlocksContext.commonLanguage.events.NewBlockReached, callback: async (event) => {
                await withContext(rpcTxs).emit(rpcTxsContext.commonLanguage.commands.NewBlockReached, event.payload);
            }
        });

}

export default {
    bindContexts
}