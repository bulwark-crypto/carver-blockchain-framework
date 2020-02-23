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
            await db.collection('addressMovementBalances').createIndex({ label: 1 }, { unique: true });
            await db.collection('addressMovementBalances').createIndex({ sequence: 1 });

            await db.collection('addressMovements').createIndex({ isReward: 1, sequence: 1 });

            await db.collection('versions').insertOne({ id: addressMovements.id, version: 1 });
        }
    }
    await initCollections();

    const getLastAddressMovementBalance = async () => {
        const addressMovementBalances = await db.collection('addressMovementBalances').find({}).sort({ sequence: -1 }).limit(1);
        for await (const addressMovementBalance of addressMovementBalances) {
            return addressMovementBalance;
        }

        return null;
    }
    const lastAddressMovementBalance = await getLastAddressMovementBalance();

    withContext(addressMovements)
        .handleQuery(addressMovementsContext.commonLanguage.queries.FindBalancesByLabels, async (labels) => {
            if (labels.length === 0) {
                return [];
            }

            return await db.collection('addressMovementBalances').find({ label: { $in: labels } }).toArray();
        })
        .handleStore(addressMovementsContext.commonLanguage.storage.InsertManyAddressBalances, async (addressBalances) => {
            if (addressBalances.length === 0) {
                return;
            }

            await db.collection('addressMovementBalances').insertMany(addressBalances);
        })
        .handleStore(addressMovementsContext.commonLanguage.storage.InsertManyAddressMovements, async (addressMovements) => {
            if (addressMovements.length === 0) {
                return;
            }

            await db.collection('addressMovements').insertMany(addressMovements);
        })
        .handleStore(addressMovementsContext.commonLanguage.storage.UpdateAddressBalances, async (addressesBalancesToUpdate) => {
            if (addressesBalancesToUpdate.length === 0) {
                return;
            }

            // Update all addresses in parallel
            await Promise.all(addressesBalancesToUpdate.map(
                async (addressesBalanceToUpdate: any) => {
                    const { label, fields } = addressesBalanceToUpdate;

                    await db.collection('addressMovementBalances').updateOne({ label }, { $set: fields });
                }));
        });

    withContext(requiredMovements)
        .streamEvents({
            type: requiredMovementsContext.commonLanguage.events.TxParsed,
            sequence: !!lastAddressMovementBalance ? lastAddressMovementBalance.sequence : 0,

            callback: async (event) => {
                const txid = event.payload

                const requiredMovement = await requiredMovements.query(requiredMovementsContext.commonLanguage.storage.FindOneByTxId, txid);

                const tx = await txs.query(txsContext.commonLanguage.storage.FindOneByTxId, txid)

                const block = await blocks.query(blocksContext.commonLanguage.storage.FindOneByHeight, tx.height)

                console.log('addressMovements:', tx.height)

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