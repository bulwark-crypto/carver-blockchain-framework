import { withContext } from '../../../classes/logic/withContext';

import basicListContext from '../common/basicList/context'
import rpcTxsContext from '../../app/rpc/txs/context'
import { WidgetBindingParams } from '../../app/carverUser/context'

const bindContexts = async ({ carverUser, carverUserId, contextMap, id, userWidgetsContextStore }: WidgetBindingParams) => {
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

            const { txid, confirmations, time } = await rpcTxs.queryStorage(rpcTxsContext.commonLanguage.storage.FindOneByTxId, 'd897ac3f8dfeeab4bea5dd4ffe16086ba743bfa88f7e5868601eb78f1f8a088b'); //@todo fetch from page params

            return { txid, confirmations, time }
        })

    return widget;
}

export default {
    bindContexts
}