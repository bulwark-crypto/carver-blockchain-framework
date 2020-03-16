
import { ContextMap } from '../../../../classes/contexts/contextMap';

import carverUserContext from '../../carverUser/context'
import publicStateContext from '../publicState/context'

const bindContexts = async (contextMap: ContextMap, id: string = null) => {
    const appContextStore = await contextMap.getContextStore({ id: 'APP' });
    const publicStateContextStore = appContextStore;

    const { registeredContext: publicState } = await publicStateContextStore.register({
        context: publicStateContext,
        storeEvents: true
    });

    // Events are streamed FROM carverUser are converted into commands for publicState
    await publicState
        .streamEvents({
            type: '*', // Forward all events from carverUser to publicState
            callback: async (event) => {

                switch (event.type) {
                    case carverUserContext.commonLanguage.events.Widgets.Added:
                        {
                            const initialWidgetsState = event.payload;

                            await publicState.dispatch({
                                id,
                                type: publicStateContext.commonLanguage.commands.Widgets.Add,
                                payload: initialWidgetsState
                            });
                        }
                        break;
                    case carverUserContext.commonLanguage.events.Widgets.Removed:
                        {
                            const widgetIds = event.payload;

                            await publicState.dispatch({
                                id,
                                type: publicStateContext.commonLanguage.commands.Widgets.Remove,
                                payload: widgetIds
                            });
                        }
                        break;
                    case carverUserContext.commonLanguage.events.Widgets.Set:
                        {
                            const initialWidgetsState = event.payload;

                            await publicState.dispatch({
                                id,
                                type: publicStateContext.commonLanguage.commands.Widgets.Set,
                                payload: initialWidgetsState
                            });
                        }
                        break;
                    case carverUserContext.commonLanguage.events.Widgets.Emitted:
                        const { id: widgetId, type: widgetType, payload: widgetPayload } = event.payload;

                        switch (widgetType) {
                            case 'INITIALIZED':
                                await publicState.dispatch({
                                    id: widgetId,
                                    type: publicStateContext.commonLanguage.commands.Widgets.Initialize,
                                    payload: widgetPayload
                                });
                                break;
                            case 'UPDATED':
                                await publicState.dispatch({
                                    id: widgetId,
                                    type: publicStateContext.commonLanguage.commands.Widgets.Update,
                                    payload: widgetPayload
                                });
                                break;
                            default:
                                console.log(`Unhandled publicState widget event ${widgetType}:`, event);
                        }
                        break;
                    default:
                        console.log('Unhandled publicState event:', event);
                }

            }
        })
}

export default {
    bindContexts
}