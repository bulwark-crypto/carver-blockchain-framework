import { withContext } from '../../../classes/logic/withContext';
import { createContextStore, ContextStore } from '../../../classes/contexts/contextStore';

import commonTableWidgetContext from '../../widgets/common/table/context'
import blocksWidgetBindings from '../../widgets/blocks/bindings'
import txsWidgetBindings from '../../widgets/txs/bindings'
import blockInfoWidgetBindings from '../../widgets/blockInfo/bindings'

import carverUserContext from './context'

import * as uuidv4 from 'uuid/v4'
import { ContextMap } from '../../../classes/contexts/contextMap';
import tableContext from '../../widgets/common/table/context'

const getNextWidgetId = () => {
    return uuidv4(); // Each new widget gets it's own RFC4122 unique id. Makes it easy to identify unique ids across entire context network.
}

const bindContexts = async (contextMap: ContextMap, id: string = null) => {
    const usersContextStore = await contextMap.getContextStore({ id: 'CARVER_USERS' });
    const userWidgetsContextStore = await contextMap.getContextStore({ id: 'USER_WIDGETS' });

    const { registeredContext: carverUser } = await usersContextStore.register({
        context: carverUserContext,
        storeEvents: false, //@todo make it false
        id
    });

    const carverUserId = id;


    const getVariantsOnPage = (page: string, params: any[]) => {
        switch (page) {
            case 'blocks':
                return [{ variant: 'blocks' }]
            case 'transactions':
                return [{ variant: 'txs' }]
            case 'block':
                console.log('get variant on page:', page, params);
                return [{ variant: 'blockInfo' }]
        }
    }

    const createWidgetContext = async (id: string, variant: string) => {
        const getContext = () => {
            //@todo move this into some config outside of this context
            switch (variant) {
                case 'blocks':
                    return { bindings: blocksWidgetBindings };
                case 'txs':
                    return { bindings: txsWidgetBindings };
                case 'blockInfo':
                    return { bindings: blockInfoWidgetBindings };
            }
        }


        const { bindings } = getContext();

        const newWidget = await bindings.bindContexts({
            contextMap,
            userWidgetsContextStore,
            carverUser,
            carverUserId,
            id
        });

        await withContext(newWidget)
            // Proxy all events from a widget to the user (that way they can get forwarded to frontend from user context)
            .streamEvents({
                type: '*',

                callback: async (event) => {
                    //@todo move these into commonLanguage as they're common amongst widgets
                    await carverUser.dispatch({
                        type: carverUserContext.commonLanguage.commands.Widgets.Emit,
                        payload: { id, ...event } // event will be emitted to frontend with id (id, type, payload)
                    });

                }
            });

        return newWidget;
    }

    withContext(carverUser)
        .handleQuery(carverUserContext.commonLanguage.queries.DispatchToWidget, async ({ id, type, payload }) => {
            const userWidget = await userWidgetsContextStore.getLocal({ context: commonTableWidgetContext, id });
            await userWidget.dispatch({ type, payload })
        })
        .handleQuery(carverUserContext.commonLanguage.queries.InsertNewWidgetContexts, async (newWidgets) => {

            const newWidgetContexts = [];
            for await (const { variant } of newWidgets) {
                const id = getNextWidgetId()
                await createWidgetContext(id, variant);

                newWidgetContexts.push({ id, variant });
            }

            return newWidgetContexts
        })
        .handleQuery(carverUserContext.commonLanguage.queries.RemoveWidgetContexts, async (widgetContextIds) => {
            for await (const widgetContextId of widgetContextIds) {
                console.log('remove widget:', widgetContextId);
                //await userWidgetsContextStore.unregister({ id: widgetContextId })
            }

            return widgetContextIds;
        })

        .handleQuery(carverUserContext.commonLanguage.queries.FindWidgetContextsOnPage, async ({ page, params }) => {
            const variants = getVariantsOnPage(page, params);

            const pageWidgetContexts = [];
            for await (const { variant } of variants) {
                const id = getNextWidgetId()
                await createWidgetContext(id, variant);

                pageWidgetContexts.push({ id, variant });
            }

            return pageWidgetContexts
        })
        .handleQuery(carverUserContext.commonLanguage.queries.InitializeWidgets, async (widgetIds: string[]) => {
            for await (const id of widgetIds) {
                const userWidget = await userWidgetsContextStore.getLocal({ context: tableContext, id });
                userWidget.dispatch({ type: 'INITIALIZE', payload: { id } }) // 'INITIALIZE' is called on each widget it is assumed to be be handled on each context
            }
        })

    return carverUser;
}

export default {
    bindContexts
}