import { RegisteredContext } from '../../../../classes/contextStore';

import { dbStore } from '../../../../classes/adapters/mongodb/mongoDbInstance'

import { createRpcInstance } from '../../../../classes/libs/rpcInstance'
import { withContext } from '../../../../classes/logic/withContext';
import { ContextStore } from '../../../../classes/contextStore';

import rpcGetInfoContext from '../getInfo/context'
import rpcBlocksContext from './context'

const rpc = createRpcInstance();

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
    const rpcBlocks = await contextStore.get(rpcBlocksContext);
    const rpcGetInfo = await contextStore.get(rpcGetInfoContext);

    const db = await dbStore.get();

    const initCollections = async () => {
        const contextVersion = await db.collection('versions').findOne({ id: rpcBlocks.id });
        if (!contextVersion) {
            await db.collection('blocks').createIndex({ height: 1 }, { unique: true });

            await db.collection('versions').insertOne({ id: rpcBlocks.id, version: 1 }); // with version we can do easy update migrations
        }

    }
    await initCollections();

    const resumeState = async () => {
        const getLastHeight = async () => {
            const blocks = await db.collection('blocks').find({}).sort({ height: -1 }).limit(1);
            if (blocks) {
                for await (const block of blocks) {
                    return block.height;
                }
            }
            return 0;
        }
        const height = await getLastHeight();

        // Initialize context with the most recent height (So we can resume at next height)
        await rpcBlocks.dispatch({
            type: rpcBlocksContext.commonLanguage.commands.Initialize, payload: {
                height
            }
        });
    }
    await resumeState();

    withContext(rpcBlocks)
        .handleQuery(rpcBlocksContext.commonLanguage.queries.GetByHeight, async (height) => {
            //@todo we can split this up into two differnet contexts (RPC:BLOCKHASH, RPC:BLOCK)
            //The current way might throw an exception on either call
            const hash = await rpc.call('getblockhash', [height]);
            const block = await rpc.call('getblock', [hash]);

            return block;
        })
        .handleStore(rpcBlocksContext.commonLanguage.storage.InsertOne, async (rpcBlock) => {
            await db.collection('blocks').insertOne(rpcBlock)
        })
        .handleStore(rpcBlocksContext.commonLanguage.storage.FindOneByHeight, async (height) => {
            return await db.collection('blocks').findOne({ height })
        });


    withContext(rpcGetInfo)
        .streamEvents({
            type: rpcGetInfoContext.commonLanguage.events.Updated,
            sessionOnly: true,
            callback: async (event) => {
                await rpcBlocks.dispatch({ type: rpcBlocksContext.commonLanguage.commands.ParseGetInfo, payload: event.payload, sequence: event.sequence });
            }
        });

}

export default {
    bindContexts
}