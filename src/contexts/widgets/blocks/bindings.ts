import { withContext } from '../../../classes/logic/withContext';
import { ContextStore } from '../../../classes/contextStore';

import blocksWidgetContext from './reducer'
import rpcGetInfoContext from '../../app/rpc/getInfo/context'

const bindContexts = async (contextStore: ContextStore, id: string) => {
    const blocksWidget = await contextStore.get(blocksWidgetContext, id);

    const coreContextStore = await contextStore.getParent('CORE');
    const rpcGetInfo = await coreContextStore.get(rpcGetInfoContext);

    withContext(blocksWidget)
        .handleQuery('LATEST_BLOCK_DETAILS', async () => {
            const { blocks } = rpcGetInfo.stateStore.state.getInfo; // State here would be the latest getInfo

            return {
                blocks
            }
        });
}

export default {
    bindContexts
}