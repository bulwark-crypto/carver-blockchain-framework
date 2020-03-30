import { withContext } from '../../../classes/logic/withContext';

import basicListContext from '../common/basicList/context'
import rpcBlocksContext from '../../app/rpc/blocks/context'
import { WidgetBindingParams } from '../../app/carverUser/context'

const bindContexts = async ({ carverUser, carverUserId, contextMap, id, userWidgetsContextStore }: WidgetBindingParams) => {
    const { registeredContext: tableWidget } = await userWidgetsContextStore.register({
        id,
        context: basicListContext,
        storeEvents: false,
        inMemory: true
    });

    const appContextStore = await contextMap.getContextStore({ id: 'APP' });
    const rpcBlocks = await appContextStore.getRemote({ context: rpcBlocksContext, replyToContext: carverUser });

    const height = 1;

    withContext(tableWidget)
        .handleQuery(basicListContext.commonLanguage.queries.FindInitialState, async () => {

            const { block } = await rpcBlocks.queryStorage(rpcBlocksContext.commonLanguage.storage.FindOneByHeight, height);

            console.log('**block:', block)

            return block;
        })

    return tableWidget;
}

export default {
    bindContexts
}