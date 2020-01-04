import { RegisteredContext } from '../../../../classes/contextStore';
import { rpc } from '../../../../classes/libs/rpcInstance'
import { withContext } from '../../../../classes/logic/withContext';
import { ContextStore } from '../../../../classes/contextStore';

import utxosContext from './context'
import rpcTxsContext from '../../rpc/txs/context'

const bindContexts = async (contextStore: ContextStore) => {
    const rpcTxs = await contextStore.get(rpcTxsContext);
    const utxos = await contextStore.get(utxosContext);

    withContext(rpcTxs)
        .streamEvents({
            type: rpcTxsContext.commonLanguage.events.NewTxFound, callback: async (event) => {
                const { id } = event.payload;

                // Get rpc block from permanent store by height
                const rpcTx = await rpcTxs.query(rpcTxsContext.commonLanguage.storage.GetOneByTxId, id);

                await utxos.dispatch({ type: utxosContext.commonLanguage.commands.ParseTx, payload: rpcTx });
            }
        });
}

export default {
    bindContexts
}