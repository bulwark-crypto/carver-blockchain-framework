import { Context } from '../../../classes/interfaces/context'
import { withState, Reducer } from '../../../classes/logic/withState'

interface EmitToWidgetPayload {
    id: string;
    payload: any;
}

const withQueryGetNewWidgetContext: Reducer = ({ state, event }) => {
    const widgetContext = event.payload;

    return withState(state)
        .set({ widgetContexts: [...state.widgetContexts, widgetContext] })

}
const withCommandWidgetsEmit: Reducer = ({ state, event }) => {
    //@todo add rate limit

    return withState(state)
        .emit({
            type: commonLanguage.events.Widgets.Emitted,
            payload: event.payload
        });
}
const withCommandWidgetsCommand: Reducer = ({ state, event }) => {

    return withState(state)
        .query(commonLanguage.queries.EmitToWidget, event.payload as EmitToWidgetPayload);
}

const withCommandWidgetsRemove: Reducer = ({ state, event }) => {
    const { id } = event.payload;

    //@todo remove from widgetsContext

    return withState(state)
        .emit({
            type: commonLanguage.events.Widgets.Removed,
            payload: { id }
        });
}

const withCommandWidgetsAdd: Reducer = ({ state, event }) => {
    const widget = event.payload;

    return withState(state)
        .query(commonLanguage.queries.GetNewWidgetContext, { ...widget, id: state.widgetContexts.length })
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
        .query(commonLanguage.queries.GetNetworkStatus)
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
    //@todo add rate limit for incoming commands

    return withState(state)
        .reduce({ type: commonLanguage.commands.Initialize, event, callback: withCommandInitialize })
        .reduce({ type: commonLanguage.commands.Connect, event, callback: withCommandConnect })

        .reduce({ type: commonLanguage.commands.Widgets.Add, event, callback: withCommandWidgetsAdd })
        .reduce({ type: commonLanguage.commands.Widgets.Remove, event, callback: withCommandWidgetsRemove })
        .reduce({ type: commonLanguage.commands.Widgets.Command, event, callback: withCommandWidgetsCommand })
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
            Command: 'WIDGETS:COMMAND',
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
        EmitToWidget: 'EMIT_TO_WIDGET'
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