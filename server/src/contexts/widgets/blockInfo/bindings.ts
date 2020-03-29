import { withContext } from '../../../classes/logic/withContext';
import { ContextStore } from '../../../classes/contexts/contextStore';

import basicListContext from '../common/basicList/context'
import rpcBlocksContext from '../../app/rpc/blocks/context'
import carverUserContext from '../../app/carverUser/context'
import { ContextMap } from '../../../classes/contexts/contextMap';

const bindContexts = async (contextMap: ContextMap, carverUserId: string, id: string) => {
    const userWidgetsContextStore = await contextMap.getContextStore({ id: 'USER_WIDGETS' });
    const { registeredContext: tableWidget } = await userWidgetsContextStore.register({
        id,
        context: basicListContext,
        storeEvents: false,
        inMemory: true
    });

    const carverUsersContextStore = await contextMap.getContextStore({ id: 'CARVER_USERS' });;
    const carverUser = await carverUsersContextStore.getLocal({
        context: carverUserContext,
        id: carverUserId
    });

    const appContextStore = await contextMap.getContextStore({ id: 'APP' });
    const rpcBlocks = await appContextStore.getRemote({ context: rpcBlocksContext, replyToContext: carverUser });

    const height = 1;

    withContext(tableWidget)
        .handleQuery(basicListContext.commonLanguage.queries.FindInitialState, async () => {

            const block = await rpcBlocks.queryStorage(rpcBlocksContext.commonLanguage.storage.FindOneByHeight, height);

            console.log('**block:', block)

            return block;
        })

    return tableWidget;
}

export default {
    bindContexts
}