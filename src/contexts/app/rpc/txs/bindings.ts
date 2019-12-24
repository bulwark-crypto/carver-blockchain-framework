import { RegisteredContext } from '../../../../classes/contextStore';
import { rpc } from '../../../../classes/libs/rpcInstance'
import { withContext } from '../../../../classes/logic/withContext';
import { ContextStore } from '../../../../classes/contextStore';

import rpcTxsContext from './context'
import rpcBlocksContext from '../blocks/context'

const bindContexts = async (contextStore: ContextStore) => {
    const rpcTxs = await contextStore.get(rpcTxsContext);
    const rpcBlocks = await contextStore.get(rpcBlocksContext);

    /*
    
    */

    // Queries to handle
    withContext(rpcTxs)
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

    withContext(rpcBlocks)
        // Proxy event RPC:NEW_BLOCK_REACHED->RPC_TXS:NEW_BLOCK
        .streamEvents({
            type: rpcBlocksContext.commonLanguage.events.NewBlockReached, callback: async (event) => {
                await withContext(rpcTxs).dispatch({ type: rpcTxsContext.commonLanguage.commands.NewBlock, payload: event.payload });
            }
        });

}

export default {
    bindContexts
}