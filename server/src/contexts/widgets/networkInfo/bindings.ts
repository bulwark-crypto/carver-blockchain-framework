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
            const { variant, display } = blocksWidget.stateStore.state;

            // Only return partial getinfo information (Other known fields are not useful)
            const {
                version,
                protocolversion,
                blocks,
                difficulty,
                moneysupply
            } = await rpcGetInfo.query(rpcGetInfoContext.commonLanguage.storage.FindLast);

            return {
                data: {
                    version,
                    protocolversion,
                    blocks,
                    difficulty,
                    moneysupply,
                },

                configuration: {
                    variant,
                    display
                }
            }
        });
}

export default {
    bindContexts
}