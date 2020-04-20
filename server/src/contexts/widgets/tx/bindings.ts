import { withContext } from '../../../classes/logic/withContext';

import basicListContext from '../common/basicList/context'
import rpcTxsContext from '../../app/rpc/txs/context'
import { WidgetBindingParams } from '../../app/carverUser/context'

const bindContexts = async ({ carverUser, carverUserId, contextMap, id, userWidgetsContextStore, variantParams }: WidgetBindingParams) => {
    const { txid, variant } = variantParams;

    const { registeredContext: widget } = await userWidgetsContextStore.register({
        id,
        context: basicListContext,
        storeEvents: false,
        inMemory: true
    });

    const appContextStore = await contextMap.getContextStore({ id: 'APP' });
    const rpcTxs = await appContextStore.getRemote({ context: rpcTxsContext, replyToContext: carverUser });

    withContext(widget)
        .handleQuery(basicListContext.commonLanguage.queries.FindInitialState, async () => {

            const { confirmations, time, date } = await rpcTxs.queryStorage(rpcTxsContext.commonLanguage.storage.FindOneByTxId, txid); //@todo fetch from page params

            return { txid, confirmations, time, date }
        })



    return widget;
}

export default {
    bindContexts
}