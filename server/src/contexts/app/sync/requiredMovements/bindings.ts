import { withContext } from '../../../../classes/logic/withContext';

import requiredMovementsContext from './context'
import utxosContext from '../utxos/context'
import rpcTxsContext from '../../rpc/txs/context'

import { dbStore } from '../../../../classes/adapters/mongodb/mongoDbInstance'
import { ContextMap } from '../../../../classes/contexts/contextMap';
import { initCache } from '../../../../classes/logic/cache';

const bindContexts = async (contextMap: ContextMap) => {

    const appContextStore = await contextMap.getContextStore({ id: 'APP' });

    const { registeredContext: requiredMovements, stateStore: requiredMovementsStateStore } = await appContextStore.register({
        context: requiredMovementsContext,
        storeEvents: true
    });

    const rpcTxs = await appContextStore.getRemote({ context: rpcTxsContext, replyToContext: requiredMovements });
    const utxos = await appContextStore.getRemote({ context: utxosContext, replyToContext: requiredMovements });

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

    const cache = initCache();

    withContext(requiredMovements)
        .handleQuery(requiredMovementsContext.commonLanguage.queries.GetUtxosForTx, async ({ rpcTx, utxoLabels, sequence }) => {
            const txUtxos = await utxos.queryStorage(utxosContext.commonLanguage.storage.GetByLabels, utxoLabels);

            //@todo only return rpcTx, .set the other arguments
            return {
                rpcTx,
                utxos: txUtxos,
                sequence
            }
        })
        .handleStore(rpcTxsContext.commonLanguage.storage.InsertOne, async (requiredMovements) => {
            const { txid } = requiredMovements;

            await db.collection('requiredMovements').insertOne(requiredMovements);

            cache.insert({ data: requiredMovements, keys: [{ txid }] }); // Pre-cache by txid
        })
        .handleStore(requiredMovementsContext.commonLanguage.storage.FindOneByTxId, async (txid) => {
            return await cache.find({
                key: { txid }, miss: async () => {
                    return await db.collection('requiredMovements').findOne({ txid });
                }
            });
        })
        .handleStore(requiredMovementsContext.commonLanguage.storage.FindCount, async ({ filter }) => {
            return await cache.find({
                key: { count: true, filter }, miss: async () => {
                    const requiredMovements = await db
                        .collection('requiredMovements')
                        .find(filter, { projection: { consolidatedAddressAmounts: 0 } })

                    return requiredMovements.count(); //@todo it's possible to read this from another context
                }
            });
        })
        .handleStore(requiredMovementsContext.commonLanguage.storage.FindManyByPage, async ({ page, limit, filter }) => {
            //@todo add caching
            let query = db
                .collection('requiredMovements')
                .find(filter, { projection: { consolidatedAddressAmounts: 0 } })
                .sort({ _id: -1 });

            if (page) {
                query = query.skip(page * limit);
            }
            if (limit) {
                query = query.limit(limit);
            }

            return await query.toArray();
        });

    utxos
        .streamEvents({
            type: utxosContext.commonLanguage.events.TxParsed,
            sequence: !!lastRequiredMovement ? lastRequiredMovement.sequence : 0, // Resume from last sequence
            callback: async (event) => {
                const txid = event.payload;

                // Get rpc tx
                const rpcTx = await rpcTxs.queryStorage(rpcTxsContext.commonLanguage.storage.FindOneByTxId, txid);

                console.log('requiredMovements:', rpcTx.height);

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