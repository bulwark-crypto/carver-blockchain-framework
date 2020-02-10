
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

                        await publicState.dispatch({
                            id,
                            type: publicStateContext.commonLanguage.commands.Widgets.Add,
                            payload: event.payload
                        });
                }

            }
        })
}

export default {
    bindContexts
}