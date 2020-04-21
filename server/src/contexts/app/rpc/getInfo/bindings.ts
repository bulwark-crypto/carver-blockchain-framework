import { withContext } from '../../../../classes/logic/withContext';
import { createRpcInstance, RpcGetinfoResponse } from '../../../../classes/libs/rpcInstance';

import appContext from '../../context'
import rpcGetInfoContext from './context'
import { ContextMap } from '../../../../classes/contexts/contextMap';

const rpc = createRpcInstance();

/**
 * Use rpc "getinfo" command to find current details. See "getblockchaininfo" for shape details
 * This rpc information is not retained in permanent store. However it might be useful to store later for time spanshot analytics.
 */
const bindContexts = async (contextMap: ContextMap) => {
    const appContextStore = await contextMap.getContextStore({ id: 'APP' });

    const { registeredContext: rpcGetInfo, stateStore: rpcGetInfoStateStore } = await appContextStore.register({
        context: rpcGetInfoContext,
        storeEvents: true
    });

    const app = await appContextStore.getRemote({ context: appContext, replyToContext: rpcGetInfo });

    // Queries to handle
    withContext(rpcGetInfo)
        .handleQuery(rpcGetInfoContext.commonLanguage.queries.GetLatestRpcGetInfo, async () => {
            const info = await rpc.call<RpcGetinfoResponse>('getinfo');
            console.log('Fetched rpc getinfo:', info.blocks);
            return info;
        })
        .handleStore(rpcGetInfoContext.commonLanguage.storage.FindLast, async () => {
            return rpcGetInfoStateStore.state.last;
        });

    app
        .streamEvents({
            type: appContext.commonLanguage.events.Initialized,
            sessionOnly: true,
            callback: async (event) => {
                //Comment to stop syncing and use existing data
                await rpcGetInfo.dispatch({ type: rpcGetInfoContext.commonLanguage.commands.Initialize, sequence: event.sequence }); // event will be emitted to frontend with id (id, type, payload)
            }
        });

}

export default {
    bindContexts
}