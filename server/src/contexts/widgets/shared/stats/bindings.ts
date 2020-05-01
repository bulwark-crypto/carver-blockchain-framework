import { withContext } from '../../../../classes/logic/withContext';

import statsContext from '../../common/basicObject/context'
import { WidgetBindingParams } from '../../../app/carverUser/context'
import apiRestContext from '../../../app/api/rest/context'
import userAnalyticsContext from '../../../app/api/userAnalytics/context'

const bindContexts = async ({ contextMap, id, userWidgetsContextStore, variantParams }: WidgetBindingParams) => {
    const { variant } = variantParams;

    const { registeredContext: widget } = await userWidgetsContextStore.register({
        id,
        context: statsContext,
        storeEvents: false,
        inMemory: false
    });

    const appContextStore = await contextMap.getContextStore({ id: 'APP' });
    const apiRest = await appContextStore.getLocal({ context: apiRestContext });
    const userAnalytics = await appContextStore.getRemote({ context: userAnalyticsContext, replyToContext: widget });

    //@todo this will be moved in favor of userAnalytics
    //@todo these events are not disconnected properly yet !!
    apiRest.streamEvents({
        type: '*',
        callback: async ({ type, payload }) => {
            switch (type) {
                case apiRestContext.commonLanguage.events.ChannelReserved:
                    const stats = await apiRest.query(apiRestContext.commonLanguage.storage.FindStats);

                    await widget.dispatch({
                        type: statsContext.commonLanguage.commands.Update,
                        payload: stats
                    });
            }
        }
    });

    userAnalytics.streamEvents({
        type: '*',
        callback: async ({ type, payload }) => {
            switch (type) {
                case userAnalyticsContext.commonLanguage.events.PageStatsUpdated:

                    await widget.dispatch({
                        type: statsContext.commonLanguage.commands.Update,
                        payload // Forward the entire payload to frontend
                    });
            }
        }
    });

    withContext(widget)
        .handleQuery(statsContext.commonLanguage.queries.FindInitialState, async () => {
            const { usersOnline } = await apiRest.query(apiRestContext.commonLanguage.storage.FindStats);

            const { pageNavigationsCount, currentWidgetContextsCount } = await userAnalytics.queryStorage(userAnalyticsContext.commonLanguage.storage.FindPageStats);
            return {
                usersOnline,
                pageNavigationsCount,
                currentWidgetContextsCount
            }
        })

    return widget;
}

export default {
    bindContexts
}