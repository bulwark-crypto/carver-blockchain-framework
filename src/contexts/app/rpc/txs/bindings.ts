import { RegisteredContext } from '../../../../classes/contextStore';
import { rpc } from '../../../../classes/libs/rpcInstance'
import { withContext } from '../../../../classes/logic/withContext';
import { ContextStore } from '../../../../classes/contextStore';

import rpcTxsContext from './context'
import rpcBlocksContext from '../blocks/context'

const bindContexts = async (contextStore: ContextStore) => {
    const rpcTxs = await contextStore.get(rpcTxsContext);
    const withRpcTxs = withContext(rpcTxs);

    const rpcBlocks = await contextStore.get(rpcBlocksContext);
    const withRpcBlocks = withContext(rpcBlocks);

    // Queries to handle
    withRpcTxs
        .handleRequest(rpcTxsContext.commonLanguage.queries.GetRawTransaction, async ({ tx, height }) => {
            console.log(height);


            //await withPermanentStore(rpcBlocks.permanentStore).query(rpcBlocksContext.commonLanguage.permanentStore.GetBlockByHeight, height);


            const rawTransaction = await rpc.call('getrawtransaction', [tx, 1]);

            // Transaction will be returned with block height appended
            return {
                ...rawTransaction,
                height
            }
        });


    // Proxy event RPC:NEW_BLOCK_REACHED->RPC_TXS:NEW_BLOCK
    withRpcBlocks
        .streamEvents({
            type: rpcBlocksContext.commonLanguage.events.NewBlockReached, callback: async (event) => {
                const height = event.payload;

                // Get rpc block from permanent store by height
                const block = await rpcBlocks.query(rpcBlocksContext.commonLanguage.storage.GetByHeight, height);

                console.log('*** get');
                //await rpcTxs.dispatch({ type: rpcTxsContext.commonLanguage.commands.ParseBlock, payload: block });
            }
        });

}

export default {
    bindContexts
}