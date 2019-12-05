import { RegisteredContext } from '../../../../classes/eventStore';
import { rpc } from '../../../../classes/libs/rpcInstance'
import { withContext } from '../../../../classes/logic/withContext';
import { ContextStore } from '../../../../classes/contextStore';

import rpcGetInfoContext from '../getInfo/context'
import rpcBlocksContext from './context'

let timer = new Date().getTime();
let elapsed = 0
let iterations = 0

/*
const benchmark = (...log: any) => {
    const currentTime = new Date().getTime();
    iterations++;
    elapsed += currentTime - timer;
    timer = currentTime;

    const benchmarkLog = `block: ${iterations}, elapsed (seconds): ${(elapsed / 1000).toFixed(2)}, ${((iterations / elapsed) * 1000).toFixed(2)}/second`;
    //require('fs').appendFileSync('log.txt', benchmarkLog);
    console.log(benchmarkLog);
}*/

const bindContexts = async (contextStore: ContextStore) => {
    const rpcGetInfo = await contextStore.get(rpcGetInfoContext);
    const rpcBlocks = await contextStore.get(rpcBlocksContext);

    // Queries to handle
    withContext(rpcBlocks)
        .handleQuery(rpcBlocksContext.commonLanguage.queries.GetBlockAtHeight, async (height) => {
            //benchmark('getblock:', height)


            //@todo we can split this up into two differnet contexts (RPC:BLOCKHASH, RPC:BLOCK)
            const hash = await rpc.call('getblockhash', [height]);
            const block = await rpc.call('getblock', [hash]);

            return block;
        });

    withContext(rpcGetInfo)
        // Proxy event RPCGETINFO:UPDATED->RPCBLOCKS:INITIALIZE (no payload)
        .streamEvents({
            type: rpcGetInfoContext.commonLanguage.events.Updated, callback: async (event) => {
                await withContext(rpcBlocks).emit(rpcBlocksContext.commonLanguage.commands.Initialize, event.payload);
            }
        });

}

export default {
    bindContexts
}