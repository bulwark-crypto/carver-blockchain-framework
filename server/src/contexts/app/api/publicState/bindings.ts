
import { ContextMap } from '../../../../classes/contexts/contextMap';

import carverUserContext from '../../carverUser/context'
import publicStateContext from '../publicState/context'
import { RegisteredContext } from '../../../../classes/contexts/registeredContext';

const bindContexts = async (contextMap: ContextMap, carverUser: RegisteredContext, id: string) => {
    const publicStateContextStore = await contextMap.getContextStore({ id: 'PUBLIC_STATES' });

    const { registeredContext: publicState } = await publicStateContextStore.register({
        context: publicStateContext,
        storeEvents: false
    });


    // Events are streamed FROM carverUser are converted into commands for publicState
    await carverUser
        .streamEvents({
            type: '*',
            callback: async (event) => {
                console.log('from carver user:', event)

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