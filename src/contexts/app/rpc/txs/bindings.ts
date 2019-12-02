import { RegisteredContext } from '../../../../classes/eventStore';
import { rpc } from '../../../../classes/libs/rpcInstance'
import { withContext } from '../../../../classes/logic/withContext';
import { ContextStore } from '../../../../classes/contextStore';

import rpcTxsContext from './context'
import rpcBlocksContext from '../blocks/context'

const bindContexts = async (contextStore: ContextStore) => {
    const rpcTxs = await contextStore.get(rpcTxsContext);
    const rpcBlocks = await contextStore.get(rpcBlocksContext);

    withContext(rpcTxs)
        .streamEventsFromContext({ type: 'RPC_BLOCKS:NEW_BLOCK_REACHED', context: rpcBlocks })
        .handleRequest('REQUEST:GET_TX', async (tx) => {
            const rawTransaction = await rpc.call('getrawtransaction', [tx, 1]);
            return rawTransaction
        });
}

export default {
    bindContexts
}