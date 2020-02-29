import { withContext } from '../../../../classes/logic/withContext';
import { createRpcInstance } from '../../../../classes/libs/rpcInstance';

import appContext from '../../context'
import rpcGetInfoContext from './context'
import { ContextMap } from '../../../../classes/contexts/contextMap';

const rpc = createRpcInstance();

const bindContexts = async (contextMap: ContextMap) => {
    const appContextStore = await contextMap.getContextStore({ id: 'APP' });
    const app = await appContextStore.get(appContext);

    const { registeredContext: rpcGetInfo, stateStore: rpcGetInfoStateStore } = await appContextStore.register({
        context: rpcGetInfoContext,
        storeEvents: true
    });

    // Queries to handle
    withContext(rpcGetInfo)
        .handleQuery(rpcGetInfoContext.commonLanguage.queries.GetLatestRpcGetInfo, async () => {
            const info = await rpc.call('getinfo');
            return info;
        })
        .handleStore(rpcGetInfoContext.commonLanguage.storage.FindLast, async () => {
            return rpcGetInfoStateStore.state.last;
        });

    withContext(app)
        .streamEvents({
            type: appContext.commonLanguage.events.Initialized,
            sessionOnly: true,
            callback: async (event) => {
                console.log('RPC_GETINFO:INITIALIZE');
                //Comment to stop syncing and use existing data
                await rpcGetInfo.dispatch({ type: rpcGetInfoContext.commonLanguage.commands.Initialize, sequence: event.sequence }); // event will be emitted to frontend with id (id, type, payload)
            }
        });

}

export default {
    bindContexts
}