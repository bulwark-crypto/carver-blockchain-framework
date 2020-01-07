import { Context } from '../../../classes/interfaces/context'
import { withState, Reducer } from '../../../classes/logic/withState'

const withQueryGetNewWidgetContext: Reducer = ({ state, event }) => {
    const widgetContext = event.payload;

    return withState(state)
        .set({ widgetContexts: [...state.widgetContexts, widgetContext] })

}
const withCommandWidgetsEmit: Reducer = ({ state, event }) => {
    //@todo add rate limit

    return withState(state)
        .emit(commonLanguage.events.Widgets.Emitted, event.payload);
}
const withCommandWidgetsRemove: Reducer = ({ state, event }) => {
    const { id } = event.payload;

    return withState(state)
        .emit(commonLanguage.events.Widgets.Removed, { id });
}

const withCommandWidgetsAdd: Reducer = ({ state, event }) => {
    const widget = event.payload;

    return withState(state)
        .request(commonLanguage.queries.GetNewWidgetContext, { ...widget, id: state.widgetContexts.length })
}

const withQueryGetNetworkStats: Reducer = ({ state, event }) => {
    //@todo the event payload here will contain network status (ex: users online)
    return withState(state)
}

const withCommandConnect: Reducer = ({ state, event }) => {
    if (state.isConnected) {
        throw commonLanguage.errors.isAlreadyConnected;
    }


    //@todo emit 
    return withState(state)
        .request(commonLanguage.queries.GetNetworkStatus)
        .set({ isConnected: true })
}

const withCommandInitialize: Reducer = ({ state, event }) => {
    if (state.isInitialized) {
        throw commonLanguage.errors.isAlreadyInitialized;
    }

    const { id } = event.payload;

    return withState(state).set({ id, isInitialized: true });
}
const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.Initialize, event, callback: withCommandInitialize })
        .reduce({ type: commonLanguage.commands.Connect, event, callback: withCommandConnect })

        .reduce({ type: commonLanguage.commands.Widgets.Add, event, callback: withCommandWidgetsAdd })
        .reduce({ type: commonLanguage.commands.Widgets.Remove, event, callback: withCommandWidgetsRemove })
        .reduce({ type: commonLanguage.commands.Widgets.Emit, event, callback: withCommandWidgetsEmit })

        .reduce({ type: commonLanguage.queries.GetNetworkStatus, event, callback: withQueryGetNetworkStats })
        .reduce({ type: commonLanguage.queries.GetNewWidgetContext, event, callback: withQueryGetNewWidgetContext });
}

const commonLanguage = {
    commands: {
        Initialize: 'INITIALIZE',
        Connect: 'CONNECT',

        Widgets: {
            Add: 'WIDGETS:ADD',
            Remove: 'WIDGETS:REMOVE',
            Emit: 'WIDGETS:EMIT',
        }
    },
    events: {
        Widgets: {
            Emitted: 'WIDGETS:EMITTED',
            Removed: 'WIDGETS:REMOVED',
        }
    },
    queries: {
        GetNetworkStatus: 'GET_NETWORK_STATUS',
        GetNewWidgetContext: 'GET_NEW_WIDGET_CONTEXT',
    },
    errors: {
        isAlreadyInitialized: 'You can only initialize state once',
        isAlreadyConnected: 'You can only emit CONNECTED once',
    }
}

const initialState = {
    id: null as string,
    isInitialized: false,
    isConnected: false,
    counter: 0,
    widgetContexts: [] as any[]
}

export default {
    initialState,
    reducer,
    commonLanguage
}