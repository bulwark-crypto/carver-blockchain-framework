import { RegisteredContext } from '../../../../classes/contextStore';
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

    const getLastUtxo = async () => {
        const utxos = await db.collection('utxos').find({}).sort({ _id: -1 }).limit(1);
        for await (const utxo of utxos) {
            return utxo;
        }

        return null;
    }
    const lastUtxo = await getLastUtxo();

    withContext(utxos)
        .handleStore(utxosContext.commonLanguage.storage.InsertMany, async (utxos) => {
            await db.collection('utxos').insertMany(utxos);
        })
        .handleStore(utxosContext.commonLanguage.storage.GetByLabels, async (labels) => {
            // Create list of txid+n for number of vouts. vouts here is the count of number of vouts in the tx
            //const labels = [...(Array(vouts).keys() as any)].map((value: any, index: number) => `${txid}:${index}`)

            if (!labels) {
                return [];
            }

            return await db.collection('utxos').find({ label: { $in: labels } }).toArray();
        });


    withContext(rpcTxs)
        .streamEvents({
            type: rpcTxsContext.commonLanguage.events.NewTxFound,
            sequence: !!lastUtxo ? lastUtxo.sequence : 0, // Resume from last sequence
            callback: async (event) => {
                const txid = event.payload;

                // Get rpc block from permanent store by height
                const rpcTx = await rpcTxs.query(rpcTxsContext.commonLanguage.storage.FindOneByTxId, txid);

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