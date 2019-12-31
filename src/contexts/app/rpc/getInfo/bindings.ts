import { RegisteredContext } from '../../../../classes/contextStore';
import { Event } from '../../../../classes/interfaces/events'
import { ContextStore } from '../../../../classes/contextStore';
import { withContext } from '../../../../classes/logic/withContext';
import { rpc } from '../../../../classes/libs/rpcInstance';

import { config } from '../../../../../config'

import appContext from '../../context'
import rpcGetInfoContext from './context'

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
        // Proxy event APP:INITIALIZED->RPCGETINFO:INITIALIZE
        .streamEvents({
            type: appContext.commonLanguage.events.Initialized, callback: async (event) => {
                //console.log(event);
                await rpcGetInfo.dispatch({ type: rpcGetInfoContext.commonLanguage.commands.Initialize }); // event will be emitted to frontend with id (id, type, payload)
            }
        })

}

export default {
    bindContexts
}