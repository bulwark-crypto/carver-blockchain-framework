import { Reducer, withState } from "../../../../classes/logic/withState";

const withCommandTrackPageNavigated: Reducer = ({ state, event }) => {
    const { page, widgetContexts, removedIds } = event.payload;

    //@todo the page contains breadcrumb/title so it can be useful for analyitcs
    //@todo the widgetContexts contain variant / isShared. This can be useful for identifying what variants are most commonly used

    const pageNavigationsCount = state.pageNavigationsCount + 1
    const currentWidgetContextsCount = state.currentWidgetContextsCount + widgetContexts.length - removedIds.length;

    return withState(state)
        .set({
            pageNavigationsCount,
            currentWidgetContextsCount
        })
        .emit({
            type: commonLanguage.events.PageStatsUpdated,
            payload: {
                pageNavigationsCount,
                currentWidgetContextsCount
            }
        })
}
const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.TrackPageNavigated, event, callback: withCommandTrackPageNavigated })
}

const commonLanguage = {
    type: 'API_USER_STATS',
    queries: {
    },
    events: {
        PageStatsUpdated: 'PAGE_STATS_UPDATED',
    },
    commands: {
        TrackPageNavigated: 'TRACK_PAGE_NAVIGATED',
    },
    storage: {
        FindPageStats: 'FIND_PAGE_STATS'
    },
    errors: {
    }
}

const initialState = {
    pageNavigationsCount: 0,
    currentWidgetContextsCount: 0
}

export default {
    initialState,
    reducer,
    commonLanguage
}