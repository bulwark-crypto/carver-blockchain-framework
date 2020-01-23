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

    const initCollections = async () => {
        const contextVersion = await db.collection('versions').findOne({ id: addresses.id });
        if (!contextVersion) {
            await db.collection('addresses').createIndex({ label: 1 }, { unique: true });
            await db.collection('addresses').createIndex({ sequence: 1 }); // This would be TxParsed sequence

            await db.collection('versions').insertOne({ id: addresses.id, version: 1 });
        }
    }
    await initCollections();

    const getLastAddress = async () => {
        const addresses = await db.collection('addresses').find({}).sort({ sequence: -1 }).limit(1);
        for await (const address of addresses) {
            return address;
        }

        return null;
    }
    const lastAddress = await getLastAddress();

    withContext(addresses)
        .handleQuery(addressesContext.commonLanguage.queries.FindByLabels, async (labels) => {
            if (labels.length === 0) {
                return [];
            }

            return await db.collection('addresses').find({ label: { $in: labels } }).toArray();
        })
        .handleStore(addressesContext.commonLanguage.storage.InsertMany, async (addresses) => {
            if (addresses.length === 0) {
                return;
            }

            await db.collection('addresses').insertMany(addresses);
        })
        .handleStore(addressesContext.commonLanguage.storage.UpdateMany, async (addressesToUpdate) => {
            if (addressesToUpdate.length === 0) {
                return;
            }

            // Update all addresses in parallel
            await Promise.all(addressesToUpdate.map(
                async (addressToUpdate: any) => {
                    const { label, fields } = addressToUpdate;

                    await db.collection('addresses').updateOne({ label }, { $set: fields });
                }));
        });

    withContext(requiredMovements)
        .streamEvents({
            type: requiredMovementsContext.commonLanguage.events.TxParsed,
            sequence: !!lastAddress ? lastAddress.sequence : 0,
            callback: async (event) => {
                //@todo
                const txid = event.payload

                const requiredMovement = await requiredMovements.query(requiredMovementsContext.commonLanguage.storage.FindOneByTxId, txid);

                const tx = await txs.query(txsContext.commonLanguage.storage.FindOneByTxId, txid)

                console.log('address:', tx.height)

                await addresses.dispatch({
                    type: addressesContext.commonLanguage.commands.ParseRequiredMovement,
                    payload: {
                        requiredMovement,
                        height: tx.height
                    },
                    sequence: event.sequence
                });
            }
        });
}

export default {
    bindContexts
}