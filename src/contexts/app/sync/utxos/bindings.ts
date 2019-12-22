import { RegisteredContext } from '../../../../classes/contextDispatcher';
import { rpc } from '../../../../classes/libs/rpcInstance'
import { withContext } from '../../../../classes/logic/withContext';
import { ContextStore } from '../../../../classes/contextStore';

import utxosContext from './context'
import rpcTxsContext from '../../rpc/txs/context'

const bindContexts = async (contextStore: ContextStore) => {
    const rpcTxs = await contextStore.get(rpcTxsContext);
    const utxos = await contextStore.get(utxosContext);

    /*withContext(utxos)
        .streamEvents({
            type: utxosContext.commonLanguage.events.TxParsed, callback: async (event) => {
                console.log('new tx found');
            }
        });*/

    withContext(rpcTxs)
        .streamEvents({
            type: rpcTxsContext.commonLanguage.events.NewTxFound, callback: async (event) => {
                await withContext(utxos).dispatch({ type: utxosContext.commonLanguage.commands.ParseTx, payload: event.payload });
            }
        });
}

export default {
    bindContexts
}