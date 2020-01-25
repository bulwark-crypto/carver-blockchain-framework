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
        .handleQuery(carverUserContext.commonLanguage.queries.GetNewWidgetContext, async ({ id, variant }) => {

            //@todo create widgets based on variant
            const blocksWidget = await userWidgetsContextStore.register({
                id,
                storeEvents: false, // Do not use event store for emitting (These events are projected out to frontend and do not need to be stored)
                context: blocksWidgetContext
            })
            await blocksWidgetBindings.bindContexts(userWidgetsContextStore, id);


            await withContext(blocksWidget)
                // Proxy all events from a widget to the user (that way they can get forwarded to frontend from user context)
                .streamEvents({
                    type: '*',

                    //@todo in-memory streaming (don't store these)
                    callback: async (event) => {
                        console.log('This will catch all widget events', event);
                        withContext(carverUser)
                            .dispatch({ type: carverUserContext.commonLanguage.commands.Widgets.Emit, payload: { id, ...event } }); // event will be emitted to frontend with id (id, type, payload)
                    }
                })
                .dispatch({ type: 'INITIALIZE', payload: { id, variant } }) // INITIALIZE is called on each widget

            return {
                id
            }
        });

}

export default {
    bindContexts
}