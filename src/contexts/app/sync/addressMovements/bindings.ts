import { RegisteredContext } from '../../../../classes/contextStore';
import { withContext } from '../../../../classes/logic/withContext';
import { ContextStore } from '../../../../classes/contextStore';
import { dbStore } from '../../../../classes/adapters/mongodb/mongoDbInstance'

import addressMovementsContext from './context'
import requiredMovementsContext from '../requiredMovements/context'
import txsContext from '../../rpc/txs/context'
import blocksContext from '../../rpc/blocks/context'

const bindContexts = async (contextStore: ContextStore) => {
    const requiredMovements = await contextStore.get(requiredMovementsContext);
    const addressMovements = await contextStore.get(addressMovementsContext);
    const txs = await contextStore.get(txsContext);
    const blocks = await contextStore.get(blocksContext);

    const db = await dbStore.get();

    const initCollections = async () => {
        const contextVersion = await db.collection('versions').findOne({ id: addressMovements.id });
        if (!contextVersion) {
            // For sorting by most recent address transactions
            await db.collection('addressMovements').createIndex({ address: 1, _id: 1 }, { unique: true });

            await db.collection('versions').insertOne({ id: addressMovements.id, version: 1 });
        }
    }
    await initCollections();

    withContext(addressMovements)
        .handleQuery(addressMovementsContext.commonLanguage.queries.FindByLabels, async (labels) => {
            if (!labels) {
                return [];
            }

            return await db.collection('addressMovements').find({ label: { $in: labels } }).toArray();
        })/*
    .handleStore(addressesContext.commonLanguage.storage.CreateAddresses, async (addresses) => {
        if (!addresses) {
            return;
        }

        await db.collection('addresses').insertMany(addresses);
    })
    .handleStore(addressesContext.commonLanguage.storage.UpdateFields, async (addressesToUpdate) => {
        // Update all addresses in parallel
        await Promise.all(addressesToUpdate.map(
            async (addressToUpdate: any) => {
                const { address, fields } = addressToUpdate;

                await db.collection('addresses').updateOne({ _id: address._id }, { $set: fields });
            }));
    })

    ;*/

    withContext(requiredMovements)
        .streamEvents({
            type: requiredMovementsContext.commonLanguage.events.TxParsed, callback: async (event) => {
                //@todo
                const txid = event.payload

                const requiredMovement = await requiredMovements.query(requiredMovementsContext.commonLanguage.storage.FindOneByTxId, txid);

                const tx = await txs.query(txsContext.commonLanguage.storage.FindOneByTxId, txid)

                const block = await blocks.query(blocksContext.commonLanguage.storage.FindOneByHeight, tx.height)

                console.log('addressMovments:', tx.height)

                await addressMovements.dispatch({
                    type: addressMovementsContext.commonLanguage.commands.ParseRequiredMovement,
                    payload: {
                        requiredMovement,
                        height: tx.height,
                        date: block.date
                    },
                    sequence: event.sequence
                });
            }
        });
}

export default {
    bindContexts
}