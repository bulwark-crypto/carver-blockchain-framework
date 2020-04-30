import { withContext } from '../../../classes/logic/withContext';
import { createContextStore, ContextStore } from '../../../classes/contexts/contextStore';

import commonTableWidgetContext from '../../widgets/common/table/context'
import blocksWidgetBindings from '../../widgets/blocks/bindings'
import txsWidgetBindings from '../../widgets/txs/bindings'
import blockInfoWidgetBindings from '../../widgets/blockInfo/bindings'
import statsWidgetBindings from '../../widgets/shared/stats/bindings'
import txWidgetBindings from '../../widgets/tx/bindings'
import addressMovementsForTxWidgetBindings from '../../widgets/addressMovementsForTx/bindings'

import addressMovementsForAddressBindings from '../../widgets/addressMovementsForAddress/bindings'

import carverUserContext from './context'

import * as uuidv4 from 'uuid/v4'
import { ContextMap } from '../../../classes/contexts/contextMap';
import tableContext from '../../widgets/common/table/context'
import { RegisteredContext } from '../../../classes/contexts/registeredContext';
import { Page } from './sharedInterfaces';

const getNextWidgetId = () => {
    return uuidv4(); // Each new widget gets it's own RFC4122 unique id. Makes it easy to identify unique ids across entire context network.
}

interface BindContextParams {
    contextMap: ContextMap;
    id: string;
    sharedWidgets: Map<string, any>;
}
/**
 * Each connected user to the network is represented as a "Carver User". They have a public state (see app/api/publicState context) which represents this user on the frontend.
 */
const bindContexts = async ({ contextMap, id, sharedWidgets }: BindContextParams) => {
    const usersContextStore = await contextMap.getContextStore({ id: 'CARVER_USERS' });
    const userWidgetsContextStore = await contextMap.getContextStore({ id: 'USER_WIDGETS' });

    const { registeredContext: carverUser } = await usersContextStore.register({
        context: carverUserContext,
        storeEvents: false, //@todo make it false
        id
    });

    const carverUserId = id;


    const getWidgetBindings = (variant: string) => {
        //@todo move this into some config outside of this context
        switch (variant) {
            case 'blocks':
                return { bindings: blocksWidgetBindings };
            case 'txs':
                return { bindings: txsWidgetBindings };
            case 'blockInfo':
                return { bindings: blockInfoWidgetBindings };
            case 'stats':
                return { bindings: statsWidgetBindings };
            case 'tx':
                return { bindings: txWidgetBindings };
            case 'addressMovementsForTx':
                return { bindings: addressMovementsForTxWidgetBindings };
            case 'addressMovementsForAddress':
                return { bindings: addressMovementsForAddressBindings };
        }
    }

    /**
     * All active widget contexts (for this user)
     */
    const widgetContexts = new Map<string, RegisteredContext>();
    const createWidgetContext = async (id: string, variantParams: any) => {
        const { variant } = variantParams;
        const { bindings } = getWidgetBindings(variant);

        const newWidget = await bindings.bindContexts({
            contextMap,
            userWidgetsContextStore,
            carverUser,
            carverUserId,
            id,
            variantParams
        });

        return newWidget;
    }

    /**
     * Proxy all events from a widget to the user (that way they can get forwarded to frontend from user context)
     */
    const subscribeToWidgetContext = async (id: string, context: RegisteredContext) => {
        await context.streamEvents({
            type: '*',

            callback: async (event) => {
                //@todo move these into commonLanguage as they're common amongst widgets
                await carverUser.dispatch({
                    type: carverUserContext.commonLanguage.commands.Widgets.Emit,
                    payload: { id, ...event } // event will be emitted to frontend with id (id, type, payload)
                });

            }
        });
    }

    withContext(carverUser)
        .handleQuery(carverUserContext.commonLanguage.queries.DispatchToWidget, async ({ id, type, payload }) => {
            const userWidget = await userWidgetsContextStore.getLocal({ context: commonTableWidgetContext, id });
            await userWidget.dispatch({ type, payload })
        })
        .handleQuery(carverUserContext.commonLanguage.queries.InsertNewWidgetContexts, async (newWidgets) => {

            const newWidgetContexts = [];
            for await (const { variant, isShared } of newWidgets) {
                const id = getNextWidgetId()
                const registeredContext = await createWidgetContext(id, { variant });
                await subscribeToWidgetContext(id, registeredContext);

                newWidgetContexts.push({ id, variant });
            }

            return newWidgetContexts
        })
        .handleQuery(carverUserContext.commonLanguage.queries.RemoveWidgetContexts, async ({ ids }: { ids: string[] }) => {
            for await (const widgetContextId of ids) {
                console.log('remove widget:', widgetContextId);
                //await userWidgetsContextStore.unregister({ id: widgetContextId })
            }

        })

        .handleQuery(carverUserContext.commonLanguage.queries.ReplacePageWidgetContexts, async (params) => {
            const { page, pushHistory, widgetContextIdsToRemove } = params
            const { variants } = page as Page;

            if (widgetContextIdsToRemove && widgetContextIdsToRemove.length > 0) {
                for (const id of widgetContextIdsToRemove) {
                    if (widgetContexts.has(id)) {
                        const registeredContext = widgetContexts.get(id);

                        //@todo .unbindContexts on widgets

                        //await userWidgetsContextStore.unregister({ id, context: 'WIDGET' }) // This removal doesn't work because we need widget context
                        //widgetContexts.delete(id);
                    }

                }
            }

            const newWidgetContexts = [];
            for await (const variantParams of variants) {
                const { variant, isShared } = variantParams;

                const getWidgetContext = async () => {
                    if (isShared) {
                        const { id, registeredContext } = sharedWidgets.get(variant);
                        return { id, registeredContext };
                    } else {
                        const id = getNextWidgetId()
                        const registeredContext = await createWidgetContext(id, variantParams);
                        widgetContexts.set(id, registeredContext);

                        return { id, registeredContext }

                    }
                }

                const { id, registeredContext } = await getWidgetContext();
                await subscribeToWidgetContext(id, registeredContext);

                newWidgetContexts.push({ id, variant, isShared });
            }

            return {
                page,
                widgetContexts: newWidgetContexts,
                pushHistory
            }
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