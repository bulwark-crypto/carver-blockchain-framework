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

    withContext(rpcBlocks)
        .streamEventsFromContext({ type: 'RPC_GETINFO:UPDATED', context: rpcGetInfo })
        .handleQuery('GET_BLOCK', async (height) => {
            //benchmark('getblock:', height)
            const hash = await rpc.call('getblockhash', [height]);
            const block = await rpc.call('getblock', [hash]);

            return block;
        });
}

export default {
    bindContexts
}