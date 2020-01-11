import { RegisteredContext } from '../../../../classes/contextStore';
import { Event } from '../../../../classes/interfaces/events'
import { ContextStore } from '../../../../classes/contextStore';
import { withContext } from '../../../../classes/logic/withContext';
import { createRpcInstance } from '../../../../classes/libs/rpcInstance';

import { config } from '../../../../../config'

import appContext from '../../context'
import rpcGetInfoContext from './context'

const rpc = createRpcInstance();

const bindContexts = async (contextStore: ContextStore) => {
    const rpcGetInfo = await contextStore.get(rpcGetInfoContext);
    const app = await contextStore.get(appContext);

    // Queries to handle
    withContext(rpcGetInfo)
        .handleQuery(rpcGetInfoContext.commonLanguage.queries.GetLatestRpcGetInfo, async () => {
            const info = await rpc.call('getinfo');
            return info;
        });



    withContext(app)
        .streamEvents({
            type: appContext.commonLanguage.events.Initialized,
            sessionOnly: true,
            callback: async (event) => {
                await rpcGetInfo.dispatch({ type: rpcGetInfoContext.commonLanguage.commands.Initialize, sequence: event.sequence }); // event will be emitted to frontend with id (id, type, payload)
            }
        })

}

export default {
    bindContexts
}