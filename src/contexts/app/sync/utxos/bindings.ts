import { RegisteredContext } from '../../../../classes/eventStore';
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
                await withContext(utxos).emit(utxosContext.commonLanguage.commands.ParseTx, event.payload);
            }
        });
    //.streamEventsFromContext({ type: rpcTxsContext.commonLanguage.events.NewTxFound, context: rpcTxs })
}

export default {
    bindContexts
}