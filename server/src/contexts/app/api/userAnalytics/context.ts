import { Reducer, withState } from "../../../../classes/logic/withState";

const withCommandTrackPageNavigated: Reducer = ({ state, event }) => {
    const { page, widgetContexts } = event.payload;

    //@todo the page contains breadcrumb/title so it can be useful for analyitcs
    //@todo the widgetContexts contain variant / isShared. This can be useful for identifying what variants are most commonly used

    return withState(state)
        .set({
            pageNavigationsCount: state.pageNavigationsCount + 1,
            currentWidgetContextsCount: state.currentWidgetContextsCount + widgetContexts.length
        })
        .emit({
            type: commonLanguage.events.PageStatsUpdated,
            payload: {
                pageNavigationsCount: state.pageNavigationsCount,
                currentWidgetContextsCount: state.currentWidgetContextsCount
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