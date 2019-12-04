import { RegisteredContext } from '../../../../classes/eventStore';
import { Event, createEvent } from '../../../../classes/interfaces/events'
import { ContextStore } from '../../../../classes/contextStore';
import { withContext } from '../../../../classes/logic/withContext';
import { rpc } from '../../../../classes/libs/rpcInstance';

import { config } from '../../../../../config'

import appContext from '../../context'
import rpcGetInfoContext from './context'

const bindContexts = async (contextStore: ContextStore) => {
    const rpcGetInfo = await contextStore.get(rpcGetInfoContext);
    const app = await contextStore.get(appContext);

    withContext(rpcGetInfo)
        .streamEventsFromContext({ type: appContext.commonLanguage.events.Initialized, context: app })
        .handleQuery(rpcGetInfoContext.commonLanguage.queries.LatestRpcGetInfo, async () => {
            const info = await rpc.call('getinfo');
            return info;
        });
}

export default {
    bindContexts
}