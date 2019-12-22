import { RegisteredContext } from '../../../../classes/contextDispatcher';
import { rpc } from '../../../../classes/libs/rpcInstance'
import { withContext } from '../../../../classes/logic/withContext';
import { ContextStore } from '../../../../classes/contextStore';

import addressesContext from './context'
import requiredMovementsContext from '../requiredMovements/context'

const bindContexts = async (contextStore: ContextStore) => {
    const requiredMovements = await contextStore.get(requiredMovementsContext);
    const addresses = await contextStore.get(addressesContext);

    withContext(requiredMovements)
        .streamEvents({
            type: requiredMovementsContext.commonLanguage.events.TxParsed, callback: async (event) => {
                await withContext(addresses).dispatch({ type: addressesContext.commonLanguage.commands.ParseRequiredMovements, payload: event.payload });
            }
        });
}

export default {
    bindContexts
}