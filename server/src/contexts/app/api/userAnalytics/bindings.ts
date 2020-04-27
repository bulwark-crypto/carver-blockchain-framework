import apiRestContext from '../rest/context'

import { ContextMap } from '../../../../classes/contexts/contextMap';

import carverUserContext from '../../carverUser/context'

import userAnalyticsContext from './context'
import { withContext } from '../../../../classes/logic/withContext';


/**
 * The Analytics platform of Carver Framework Client. Get realtime analytics of user activities and resource usage. 
 */
const bindContexts = async (contextMap: ContextMap) => {
    const appContextStore = await contextMap.getContextStore({ id: 'APP' });
    const usersContextStore = await contextMap.getContextStore({ id: 'CARVER_USERS' });

    const apiRest = await appContextStore.getLocal({
        context: apiRestContext,
    });

    const { registeredContext: userAnalytics, stateStore: userAnalyticsStateStore } = await appContextStore.register({
        context: userAnalyticsContext,
        storeEvents: false,
        inMemory: false
    });

    withContext(userAnalytics)
        .handleStore(userAnalyticsContext.commonLanguage.storage.FindPageStats, async (payload) => {
            const { pageNavigationsCount, currentWidgetContextsCount } = userAnalyticsStateStore.state;

            return {
                pageNavigationsCount,
                currentWidgetContextsCount
            }
        })


    apiRest
        .streamEvents({
            type: '*',
            sessionOnly: true,
            callback: async (event) => {
                switch (event.type) {
                    // When new user is initialized on the network
                    case apiRestContext.commonLanguage.events.ChannelReserved:
                        const { id } = event.payload;

                        //@todo the reserved channel is good to collect analytics on as well

                        // For each user track a few of their actions (for stat totals)
                        const carverUser = await usersContextStore.getLocal({ context: carverUserContext, id })
                        carverUser
                            .streamEvents({
                                type: '*',
                                sessionOnly: true,
                                callback: async (event) => {
                                    switch (event.type) {
                                        case carverUserContext.commonLanguage.events.Pages.Navigated:
                                            const { page, widgetContexts } = event.payload;

                                            await userAnalytics.dispatch({ type: userAnalyticsContext.commonLanguage.commands.TrackPageNavigated, payload: { page, widgetContexts } })

                                            break;
                                    }

                                }
                            });



                        break;
                }
                console.log(event);
            }
        });


    console.log('User Analytics context bound');
}

export default {
    bindContexts
}