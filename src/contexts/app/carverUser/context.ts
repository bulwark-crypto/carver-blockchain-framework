import { Context } from '../../../classes/interfaces/context'
import { withState, Reducer } from '../../../classes/logic/withState'

import * as uuidv4 from 'uuid/v4'

interface EmitToWidgetPayload {
    id: string;
    payload: any;
}

const withQueryInsertNewWidgetContext: Reducer = ({ state, event }) => {
    const { id, publicState } = event.payload;

    return withState(state)
        .emit({
            type: commonLanguage.events.PublicState.Set,
            payload: publicState,
            id
        })
        .set({
            widgetContexts: [
                ...state.widgetContexts,
                id
            ]
        })

}
const withCommandWidgetsEmit: Reducer = ({ state, event }) => {
    //@todo add rate limit. We can also queue events and emit them as a batch

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
    const { variant } = event.payload;

    // At the moment each widget context id is simply it's length 
    const getNextWidgetId = () => {
        return uuidv4(); // Each new widget gets it's own RFC4122 unique id. Makes it easy to identify unique ids across entire context network.
    }
    const id = getNextWidgetId();

    return withState(state)
        .query(commonLanguage.queries.InsertNewWidgetContext, {
            id,
            variant
        })
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

        .reduce({ type: commonLanguage.queries.InsertNewWidgetContext, event, callback: withQueryInsertNewWidgetContext });
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
        PublicState: {
            Set: 'SET',
            Added: 'ADDED'
        },
        Widgets: {
            Emitted: 'WIDGETS:EMITTED',
            Removed: 'WIDGETS:REMOVED',
        }
    },
    queries: {
        InsertNewWidgetContext: 'INSERT_NEW_WIDGET_CONTEXT',
        EmitToWidget: 'EMIT_TO_WIDGET'
    },
    storage: {
        FindPublicState: 'FIND_PUBLIC_STATE'
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
    widgetContexts: [] as any[]
}

export default {
    initialState,
    reducer,
    commonLanguage
}