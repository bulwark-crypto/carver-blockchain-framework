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

    withContext(rpcTxs)
        .streamEvents({
            type: rpcTxsContext.commonLanguage.events.NewTxFound, callback: async (event) => {
                const id = event.payload;


                // Get rpc block from permanent store by height
                const rpcTx = await rpcTxs.query(rpcTxsContext.commonLanguage.storage.GetOneByTxId, id);

                //console.log('new tx found:', event, rpcTx);
                await utxos.dispatch({ type: utxosContext.commonLanguage.commands.ParseTx, payload: rpcTx });
            }
        });
}

export default {
    bindContexts
}