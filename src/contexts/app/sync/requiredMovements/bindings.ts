import { RegisteredContext } from '../../../../classes/contextStore';
import { withContext } from '../../../../classes/logic/withContext';
import { ContextStore } from '../../../../classes/contextStore';

import requiredMovementsContext from './context'
import utxosContext from '../utxos/context'
import rpcTxsContext from '../../rpc/txs/context'

import { dbStore } from '../../../../classes/adapters/mongodb/mongoDbInstance'

const bindContexts = async (contextStore: ContextStore) => {
    const requiredMovements = await contextStore.get(requiredMovementsContext);
    const rpcTxs = await contextStore.get(rpcTxsContext);
    const utxos = await contextStore.get(utxosContext);

    const db = await dbStore.get();

    const initCollections = async () => {
        const contextVersion = await db.collection('versions').findOne({ id: requiredMovements.id });
        if (!contextVersion) {
            await db.collection('requiredMovements').createIndex({ txid: 1 }, { unique: true });
            await db.collection('requiredMovements').createIndex({ isReward: 1, _id: 1 });

            await db.collection('versions').insertOne({ id: requiredMovements.id, version: 1 });
        }
    }
    await initCollections();

    const getLastRequiredMovement = async () => {
        const requiredMovements = await db.collection('requiredMovements').find({}).sort({ _id: -1 }).limit(1);
        for await (const requiredMovement of requiredMovements) {
            return requiredMovement;
        }

        return null;
    }
    const lastRequiredMovement = await getLastRequiredMovement();


    const resumeState = async () => {
        const rewardsCount = await db.collection('requiredMovements').find({ isReward: true }).count();
        const nonRewardsCount = await db.collection('requiredMovements').find({ isReward: false }).count();

        console.log('rewardsCount:', rewardsCount, 'nonRewardsCount:', nonRewardsCount)

        if (lastRequiredMovement) {
            const { height } = lastRequiredMovement;
            await requiredMovements.dispatch({
                type: requiredMovementsContext.commonLanguage.commands.Initialize,
                payload: {
                    height,
                    rewardsCount,
                    nonRewardsCount
                }
            });
        }
    }
    await resumeState();

    withContext(requiredMovements)
        .handleStore(rpcTxsContext.commonLanguage.storage.InsertOne, async (requiredMovements) => {
            await db.collection('requiredMovements').insertOne(requiredMovements);
        })
        .handleQuery(requiredMovementsContext.commonLanguage.queries.GetUtxosForTx, async ({ rpcTx, utxoLabels, sequence }) => {
            const txUtxos = await utxos.query(utxosContext.commonLanguage.storage.GetByLabels, utxoLabels);

            //@todo only return rpcTx, .set the other arguments
            return {
                rpcTx,
                utxos: txUtxos,
                sequence
            }
        })
        .handleStore(requiredMovementsContext.commonLanguage.storage.FindOneByTxId, async (txid) => {
            return await db.collection('requiredMovements').findOne({ txid });
        })
        .handleStore(requiredMovementsContext.commonLanguage.storage.FindCount, async ({ filter }) => {

            // Current height will equal number of blocks. So we don't even need to query db to find number of blocks in db.
            const { rewardsCount, nonRewardsCount } = requiredMovements.stateStore.state;

            if (!filter) {
                return rewardsCount + nonRewardsCount;
            }

            const { isReward } = filter;
            if (!isReward) {
                return nonRewardsCount;
            }

            return rewardsCount;
        })
        .handleStore(requiredMovementsContext.commonLanguage.storage.FindManyByPage, async ({ page, limit, filter }) => {

            const { isReward } = filter;

            //@todo add caching
            const requiredMovements = await db
                .collection('requiredMovements')
                .find({ isReward }, { projection: { consolidatedAddressAmounts: 0 } })
                .sort({ _id: -1 })
                .skip(page * limit)
                .limit(limit);

            return requiredMovements.toArray();
        });

    withContext(utxos)
        .streamEvents({
            type: utxosContext.commonLanguage.events.TxParsed,
            sequence: !!lastRequiredMovement ? lastRequiredMovement.sequence : 0, // Resume from last sequence
            callback: async (event) => {
                const txid = event.payload;

                // Get rpc tx
                const rpcTx = await rpcTxs.query(rpcTxsContext.commonLanguage.storage.FindOneByTxId, txid);

                console.log('requiredMovements:', rpcTx.height)

                await requiredMovements.dispatch({
                    type: requiredMovementsContext.commonLanguage.commands.ParseTx,
                    payload: {
                        rpcTx
                    },
                    sequence: event.sequence // We'll store block sequence with the tx so we can resume from this state later on
                })
            }
        });
}

export default {
    bindContexts
}