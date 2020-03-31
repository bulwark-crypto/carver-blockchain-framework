import { withContext } from '../../../classes/logic/withContext';

import basicListContext from '../common/basicList/context'
import rpcBlocksContext from '../../app/rpc/blocks/context'
import { WidgetBindingParams } from '../../app/carverUser/context'

const bindContexts = async ({ carverUser, carverUserId, contextMap, id, userWidgetsContextStore }: WidgetBindingParams) => {
    const { registeredContext: widget } = await userWidgetsContextStore.register({
        id,
        context: basicListContext,
        storeEvents: false,
        inMemory: true
    });

    const appContextStore = await contextMap.getContextStore({ id: 'APP' });
    const rpcBlocks = await appContextStore.getRemote({ context: rpcBlocksContext, replyToContext: carverUser });

    withContext(widget)
        .handleQuery(basicListContext.commonLanguage.queries.FindInitialState, async () => {

            const { height, confirmations, hash, difficulty, size, date } = await rpcBlocks.queryStorage(rpcBlocksContext.commonLanguage.storage.FindOneByHeight, 1);

            return { height, confirmations, hash, difficulty, size, date }
        })

    return widget;
}

export default {
    bindContexts
}