
import { ContextMap } from '../../../../classes/contexts/contextMap';

import carverUserContext from '../../carverUser/context'
import publicStateContext from '../publicState/context'
import { RegisteredContext } from '../../../../classes/contexts/registeredContext';

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { config } from '../../../../../config'

const bindContexts = async (contextMap: ContextMap, id: string) => {
    const publicStateContextStore = await contextMap.getContextStore({ id: 'PUBLIC_STATES' });

    const carverUsersContextStore = await contextMap.getContextStore({ id: 'CARVER_USERS' });;
    const carverUser = await carverUsersContextStore.getLocal({
        context: carverUserContext,
        id
    });

    const { registeredContext: publicState } = await publicStateContextStore.register({
        id,
        context: publicStateContext,
        storeEvents: false,
        inMemory: true
    });

    const axiosInstance = axios.create();


    // Forward any events from public state to frontend (via nchan)
    await publicState
        .streamEvents({
            type: publicStateContext.commonLanguage.events.Updated,
            callback: async (event) => {
                const { payload } = event;
                const pubEndpoint = `http://${config.nchan.host}:${config.nchan.port}/pub/${id}`;

                await axiosInstance.post(pubEndpoint, payload);
            }
        });

    // Events are streamed FROM carverUser are converted into commands for publicState
    await carverUser
        .streamEvents({
            type: '*',
            callback: async (event) => {
                switch (event.type) {
                    case carverUserContext.commonLanguage.events.Pages.Navigated:
                        {
                            const { page, widgetContexts } = event.payload;

                            await publicState.dispatch({
                                id,
                                type: publicStateContext.commonLanguage.commands.Pages.Navigate,
                                payload: { page, widgetContexts }
                            });
                        }
                        break;
                    case carverUserContext.commonLanguage.events.Initialized:
                        {
                            await publicState.dispatch({
                                id,
                                type: publicStateContext.commonLanguage.commands.Initialize,
                                payload: { id }
                            });
                        }
                        break;
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
                    /*case carverUserContext.commonLanguage.events.Widgets.Set:
                        {
                            const initialWidgetsState = event.payload;

                            await publicState.dispatch({
                                id,
                                type: publicStateContext.commonLanguage.commands.Widgets.Set,
                                payload: initialWidgetsState
                            });
                        }
                        break;*/
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