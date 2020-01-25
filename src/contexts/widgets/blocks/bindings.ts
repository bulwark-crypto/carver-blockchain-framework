import { withContext } from '../../../classes/logic/withContext';
import { ContextStore } from '../../../classes/contextStore';

import blocksWidgetContext from './context'
import rpcGetInfoContext from '../../app/rpc/getInfo/context'

const bindContexts = async (contextStore: ContextStore, id: string) => {
    const blocksWidget = await contextStore.get(blocksWidgetContext, id);

    const coreContextStore = await contextStore.getParent('CORE');
    const rpcGetInfo = await coreContextStore.get(rpcGetInfoContext);

    withContext(blocksWidget)
        .handleQuery(blocksWidgetContext.commonLanguage.queries.GetInitialState, async () => {
            const blocks = await rpcGetInfo.query(rpcGetInfoContext.commonLanguage.storage.FindCurrentBlocksCount);

            return {
                blocks
            }
        });
}

export default {
    bindContexts
}