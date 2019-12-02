import { RegisteredContext } from '../../../classes/eventStore';
import { withContext } from '../../../classes/logic/withContext';
import { createContextStore, ContextStore } from '../../../classes/contextStore';

import blocksWidgetContext from '../../widgets/blocks/reducer'
import blocksWidgetBindings from '../../widgets/blocks/bindings'

import carverUserContext from './context'

const bindContexts = async (contextStore: ContextStore, id: string = null) => {
    const widgetsContextStore = createContextStore({ id: 'USER', parent: contextStore });

    const carverUser = await contextStore.get(carverUserContext, id)

    withContext(carverUser)
        .handleRequest('REQUEST:NEW_WIDGET_CONTEXT', async ({ id, variant }) => { // .on('',...)
            const blocksWidget = await widgetsContextStore.register({ id, context: blocksWidgetContext })
            await blocksWidgetBindings.bindContexts(widgetsContextStore, id);

            await withContext(blocksWidget)
                .streamEvents({
                    type: '*', callback: async (event) => {
                        console.log('This will catch all widget events', event);
                        withContext(carverUser).emit('WIDGET:EMITTED', { id, ...event }); // event will be emitted to frontend with id (id, type, payload)
                    }
                })
                .emit('INITIALIZE', { id, variant })

            return {
                id
            }
        });

}

export default {
    bindContexts
}