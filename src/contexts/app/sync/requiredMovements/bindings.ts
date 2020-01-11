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

    withContext(requiredMovements)
        .handleStore(rpcTxsContext.commonLanguage.storage.InsertOne, async (requiredMovements) => {
            await db.collection('requiredMovements').insertOne(requiredMovements);
        })
        .handleQuery(requiredMovementsContext.commonLanguage.queries.GetUtxosForTx, async ({ rpcTx, utxoLabels, sequence }) => {
            const txUtxos = await utxos.query(utxosContext.commonLanguage.storage.GetByLabels, utxoLabels);

            return {
                rpcTx,
                utxos: txUtxos,
                sequence
            }
        });

    withContext(utxos)
        .streamEvents({
            type: utxosContext.commonLanguage.events.TxParsed, callback: async (event) => {
                const txid = event.payload;

                // Get rpc tx,block and utxos required to parse tx movements
                const rpcTx = await rpcTxs.query(rpcTxsContext.commonLanguage.storage.FindOneByTxId, txid);
                //console.log(txid, txUtxos);

                await requiredMovements.dispatch({
                    type: requiredMovementsContext.commonLanguage.commands.ParseTx,
                    payload: {
                        rpcTx,
                        //height: rpcBlock.height,
                        //utxos: txUtxos
                    },
                    sequence: event.sequence // We'll store block sequence with the tx so we can resume from this state later on
                })
            }
        });
}

export default {
    bindContexts
}