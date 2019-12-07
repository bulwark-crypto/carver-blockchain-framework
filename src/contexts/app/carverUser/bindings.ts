import { RegisteredContext } from '../../../classes/eventStore';
import { withContext } from '../../../classes/logic/withContext';
import { createContextStore, ContextStore } from '../../../classes/contextStore';

import blocksWidgetContext from '../../widgets/blocks/context'
import blocksWidgetBindings from '../../widgets/blocks/bindings'

import carverUserContext from './context'

const bindContexts = async (contextStore: ContextStore, id: string = null) => {
    // Fetch user's widget context store
    const userWidgetsContextStore = createContextStore({ id: 'USER', parent: contextStore });

    const carverUser = await contextStore.get(carverUserContext, id)

    withContext(carverUser)
        .handleRequest(carverUserContext.commonLanguage.queries.GetNewWidgetContext, async ({ id, variant }) => {

            //@todo create widgets based on variant
            const blocksWidget = await userWidgetsContextStore.register({ id, context: blocksWidgetContext })
            await blocksWidgetBindings.bindContexts(userWidgetsContextStore, id);

            await withContext(blocksWidget)
                // Proxy all events from a widget to the user (that way they can get forwarded to frontend from user context)
                .streamEvents({
                    type: '*', callback: async (event) => {
                        console.log('This will catch all widget events', event);
                        withContext(carverUser).emit(carverUserContext.commonLanguage.commands.Widgets.Emit, { id, ...event }); // event will be emitted to frontend with id (id, type, payload)
                    }
                })
                .emit(carverUserContext.commonLanguage.commands.Initialize, { id, variant })

            return {
                id
            }
        });

}

export default {
    bindContexts
}