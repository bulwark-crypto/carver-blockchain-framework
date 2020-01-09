import { RegisteredContext } from '../../../../classes/contextStore';
import { rpc } from '../../../../classes/libs/rpcInstance'
import { withContext } from '../../../../classes/logic/withContext';
import { ContextStore } from '../../../../classes/contextStore';
import { dbStore } from '../../../../classes/adapters/mongodb/mongoDbInstance'

import utxosContext from './context'
import rpcTxsContext from '../../rpc/txs/context'

const bindContexts = async (contextStore: ContextStore) => {
    const rpcTxs = await contextStore.get(rpcTxsContext);
    const utxos = await contextStore.get(utxosContext);

    const db = await dbStore.get();

    const initCollections = async () => {
        const contextVersion = await db.collection('versions').findOne({ id: utxos.id });
        if (!contextVersion) {
            await db.collection('utxos').createIndex({ label: 1 }, { unique: true });

            await db.collection('versions').insertOne({ id: utxos.id, version: 1 });
        }
    }
    await initCollections();

    withContext(utxos)
        .handleStore(utxosContext.commonLanguage.storage.InsertMany, async (utxos) => {
            await db.collection('utxos').insertMany(utxos);
        })
    /*.handleStore(utxosContext.commonLanguage.storage.UpdateLastTxSequence, async (sequence) => {
        await db.collection('eventSequences').updateOne(
            { id: utxos.id },
            { $set: { id: utxos.id, sequence } },
            { upsert: true }
        );
    })*/


    //const rpcTxSequence = await db.collection('eventSequences').findOne({ id: utxos.id });
    withContext(rpcTxs)
        .streamEvents({
            type: rpcTxsContext.commonLanguage.events.NewTxFound,
            toId: utxos.id, // Store "rpcTxs -> utxos" sequence after each callback
            //sequence: !!rpcTxSequence ? rpcTxSequence.sequence : 0,
            callback: async (event) => {
                const id = event.payload;

                // Get rpc block from permanent store by height
                const rpcTx = await rpcTxs.query(rpcTxsContext.commonLanguage.storage.GetOneByTxId, id);

                await utxos.dispatch({
                    type: utxosContext.commonLanguage.commands.ParseTx,
                    payload: rpcTx,
                    sequence: event.sequence
                });
            }
        });
}

export default {
    bindContexts
}