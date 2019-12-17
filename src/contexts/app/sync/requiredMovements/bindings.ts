import { RegisteredContext } from '../../../../classes/eventStore';
import { rpc } from '../../../../classes/libs/rpcInstance'
import { withContext } from '../../../../classes/logic/withContext';
import { ContextStore } from '../../../../classes/contextStore';

import requiredMovementsContext from './context'
import utxosContext from '../utxos/context'
import rpcTxsContext from '../../rpc/txs/context'

const bindContexts = async (contextStore: ContextStore) => {
    const requiredMovements = await contextStore.get(requiredMovementsContext);
    const rpcTxs = await contextStore.get(rpcTxsContext);
    const utxos = await contextStore.get(utxosContext);

    withContext(utxos)
        .streamEvents({
            type: utxosContext.commonLanguage.events.TxParsed, callback: async (event) => {
                //console.log('here');
                await withContext(requiredMovements).dispatch({ type: requiredMovementsContext.commonLanguage.commands.ParseTx, payload: event.payload });
            }
        });
}

export default {
    bindContexts
}