import { RegisteredContext } from '../../../../classes/contextStore';
import { withContext } from '../../../../classes/logic/withContext';
import { ContextStore } from '../../../../classes/contextStore';
import { dbStore } from '../../../../classes/adapters/mongodb/mongoDbInstance'

import addressesContext from './context'
import requiredMovementsContext from '../requiredMovements/context'
import txsContext from '../../rpc/txs/context'

const bindContexts = async (contextStore: ContextStore) => {
    const requiredMovements = await contextStore.get(requiredMovementsContext);
    const addresses = await contextStore.get(addressesContext);
    const txs = await contextStore.get(txsContext);

    const db = await dbStore.get();

    /*
    const initCollections = async () => {
        const contextVersion = await db.collection('versions').findOne({ id: addresses.id });
        if (!contextVersion) {
            await db.collection('addresses').createIndex({ label: 1 }, { unique: true });

            await db.collection('versions').insertOne({ id: addresses.id, version: 1 });
        }
    }
    await initCollections();
    */

    const initCollections = async () => {
        const contextVersion = await db.collection('versions').findOne({ id: addresses.id });
        if (!contextVersion) {
            await db.collection('addresses').createIndex({ label: 1 }, { unique: true });

            await db.collection('versions').insertOne({ id: addresses.id, version: 1 });
        }
    }
    await initCollections();

    withContext(addresses)
        .handleQuery(addressesContext.commonLanguage.queries.FindByLabels, async (labels) => {
            if (!labels) {
                return [];
            }

            return await db.collection('addresses').find({ label: { $in: labels } }).toArray();
        })
        .handleStore(addressesContext.commonLanguage.storage.CreateAddresses, async (addresses) => {
            if (!addresses) {
                return;
            }

            return await db.collection('addresses').insertMany(addresses);
        });

    withContext(requiredMovements)
        .streamEvents({
            type: requiredMovementsContext.commonLanguage.events.TxParsed, callback: async (event) => {
                //@todo
                const txid = event.payload

                const requiredTxMovements = await requiredMovements.query(requiredMovementsContext.commonLanguage.storage.FindOneByTxId, txid);

                const tx = await txs.query(txsContext.commonLanguage.storage.FindOneByTxId, txid)

                await addresses.dispatch({
                    type: addressesContext.commonLanguage.commands.ParseRequiredMovements,
                    payload: {
                        requiredMovements: requiredTxMovements,
                        height: tx.height
                    }
                });
            }
        });
}

export default {
    bindContexts
}