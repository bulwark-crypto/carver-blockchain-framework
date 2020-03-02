import { withContext } from '../../../../classes/logic/withContext';
import { dbStore } from '../../../../classes/adapters/mongodb/mongoDbInstance'

import utxosContext from './context'
import rpcTxsContext from '../../rpc/txs/context'
import { ContextMap } from '../../../../classes/contexts/contextMap';

const bindContexts = async (contextMap: ContextMap) => {
    const appContextStore = await contextMap.getContextStore({ id: 'APP' });
    const rpcTxs = await appContextStore.get({ context: rpcTxsContext });

    const { registeredContext: utxos } = await appContextStore.register({
        context: utxosContext,
        storeEvents: true
    });

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
            if (utxos.length > 0) {
                await db.collection('utxos').insertMany(utxos);
            }
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
                const rpcTx = await rpcTxs.queryStorage(rpcTxsContext.commonLanguage.storage.FindOneByTxId, txid);

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