import { RegisteredContext } from '../../../../classes/contextStore';
import { rpc } from '../../../../classes/libs/rpcInstance'
import { withContext } from '../../../../classes/logic/withContext';
import { ContextStore } from '../../../../classes/contextStore';
import { dbStore } from '../../../../classes/adapters/mongodb/mongoDbInstance'

import rpcTxsContext from './context'
import rpcBlocksContext from '../blocks/context'

const bindContexts = async (contextStore: ContextStore) => {
    const rpcTxs = await contextStore.get(rpcTxsContext);
    const rpcBlocks = await contextStore.get(rpcBlocksContext);

    const db = await dbStore.get();

    const initCollections = async () => {
        const contextVersion = await db.collection('versions').findOne({ id: rpcTxs.id });
        if (!contextVersion) {
            await db.collection('txs').createIndex({ height: 1 }, { unique: true });
            await db.collection('txs').createIndex({ txid: 1 }, { unique: true });

            await db.collection('versions').insertOne({ id: rpcTxs.id, version: 1 });
        }
    }
    await initCollections();

    const resumeState = async () => {
        const getLastHeight = async () => {
            const txs = await db.collection('txs').find({}).sort({ height: -1 }).limit(1);
            if (txs) {
                for await (const tx of txs) {
                    return tx.height;
                }
            }
            return 0;
        }
        const height = await getLastHeight();

        // Initialize context with the most recent height (So we can resume at next height)
        await rpcTxs.dispatch({
            type: rpcTxsContext.commonLanguage.commands.Initialize, payload: {
                height
            }
        });
    }
    await resumeState();


    withContext(rpcTxs)
        .handleRequest(rpcTxsContext.commonLanguage.queries.GetRawTransaction, async ({ tx, height }) => {
            //await withPermanentStore(rpcBlocks.permanentStore).query(rpcBlocksContext.commonLanguage.permanentStore.GetBlockByHeight, height);


            const rpcTx = await rpc.call('getrawtransaction', [tx, 1]);

            // Transaction will be returned with block height appended
            return {
                rpcTx,
                height
            }
        })
        .handleStore(rpcTxsContext.commonLanguage.storage.InsertOne, async (tx) => {
            await db.collection('txs').insertOne(tx);
        })
        .handleStore(rpcTxsContext.commonLanguage.storage.GetByHeight, async (height) => {
            return await db.collection('txs').find({ height });
        })
        .handleStore(rpcTxsContext.commonLanguage.storage.GetOneByTxId, async (txid) => {
            return await db.collection('txs').findOne({ txid });
        });


    withContext(rpcBlocks)
        .streamEvents({
            type: rpcBlocksContext.commonLanguage.events.NewBlockReached, callback: async (event) => {
                const height = event.payload;

                // Get rpc block from permanent store by height
                const block = await rpcBlocks.query(rpcBlocksContext.commonLanguage.storage.GetByHeight, height);

                await rpcTxs.dispatch({ type: rpcTxsContext.commonLanguage.commands.ParseBlock, payload: block });
            }
        });

}

export default {
    bindContexts
}