
import { ContextStore } from '../../../../classes/contextStore';
import { withContext } from '../../../../classes/logic/withContext';

import carverUserContext from '../../carverUser/context'
import publicStateContext from '../publicState/context'

const bindContexts = async (carverUsersContextStore: ContextStore, publicStatesContextStore: ContextStore, id: string) => {
    const carverUser = await carverUsersContextStore.get(carverUserContext, id);
    const publicState = await publicStatesContextStore.get(publicStateContext, id);

    // Events are streamed FROM carverUser are converted into commands for publicState
    await withContext(carverUser)
        .streamEvents({
            type: '*', // Forward all events from carverUser to publicState
            callback: async (event) => {

                switch (event.type) {
                    case carverUserContext.commonLanguage.events.Widgets.Added:
                        const initialWidgetState = event.payload;

                        await publicState.dispatch({
                            id,
                            type: publicStateContext.commonLanguage.commands.Widgets.Add,
                            payload: initialWidgetState
                        });
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

                        console.log('***widgets event:', event);
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