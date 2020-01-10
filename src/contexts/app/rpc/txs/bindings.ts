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

    const getLastTx = async () => {
        const txs = await db.collection('txs').find({}).sort({ _id: -1 }).limit(1);
        for await (const tx of txs) {
            return tx;
        }

        return null;
    }
    const lastTx = await getLastTx();

    const resumeState = async () => {
        const height = !!lastTx ? lastTx.height : 0;

        // Initialize context with the most recent height (So we can resume at next height)
        await rpcTxs.dispatch({
            type: rpcTxsContext.commonLanguage.commands.Initialize, payload: {
                height
            }
        });
    }
    await resumeState();

    withContext(rpcTxs)
        .handleQuery(rpcTxsContext.commonLanguage.queries.GetRawTransaction, async ({ txid, height, sequence }) => {
            //await withPermanentStore(rpcBlocks.permanentStore).query(rpcBlocksContext.commonLanguage.permanentStore.GetBlockByHeight, height);

            const rpcTx = await rpc.call('getrawtransaction', [txid, 1]);

            // Transaction will be returned with block height and NewBlockReached sequence
            return {
                rpcTx,
                height,
                sequence
            }
        })
        .handleStore(rpcTxsContext.commonLanguage.storage.InsertOne, async (tx) => {
            await db.collection('txs').insertOne(tx);
        })
        .handleStore(rpcTxsContext.commonLanguage.storage.GetByHeight, async (height) => {
            return await db.collection('txs').find({ height }).toArray();
        })
        .handleStore(rpcTxsContext.commonLanguage.storage.FindOneByTxId, async (txid) => {
            return await db.collection('txs').findOne({ txid });
        });


    withContext(rpcBlocks)
        .streamEvents({
            type: rpcBlocksContext.commonLanguage.events.NewBlockReached,
            sequence: !!lastTx ? lastTx.sequence : 0, // Resume from last sequence
            callback: async (event) => {
                const height = event.payload;

                // Get rpc block from permanent store by height
                const block = await rpcBlocks.query(rpcBlocksContext.commonLanguage.storage.FindOneByHeight, height);

                await rpcTxs.dispatch({
                    type: rpcTxsContext.commonLanguage.commands.ParseBlock,
                    payload: block,
                    sequence: event.sequence // We'll store block sequence with the tx so we can resume from this state later on
                });
            }
        });

}

export default {
    //@todo add onRegistration that would 
    bindContexts
}