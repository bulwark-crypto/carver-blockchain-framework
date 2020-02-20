import { Context } from '../../../classes/interfaces/context'
import { withState, Reducer } from '../../../classes/logic/withState'

import * as uuidv4 from 'uuid/v4'

interface DispatchToWidgetPayload {
    id: string;
    payload: any;
}
export interface WidgetContext {
    id: string;
    variant: any;
}

const withQueryInsertNewWidgetContexts: Reducer = ({ state, event }) => {
    const newWidgetContexts = event.payload;
    const ids = newWidgetContexts.map((newWidgetContext: WidgetContext) => newWidgetContext.id);

    return withState(state)
        .emit({
            type: commonLanguage.events.Widgets.Added,
            payload: newWidgetContexts
        })
        .set({
            widgetContexts: [
                ...state.widgetContexts,
                ...newWidgetContexts
            ]
        })
        .query(commonLanguage.queries.InitializeWidgets, ids)

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
        .query(commonLanguage.queries.DispatchToWidget, event.payload as DispatchToWidgetPayload);
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
        .query(commonLanguage.queries.InsertNewWidgetContexts, [{
            id,
            variant
        }])
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

    return withState(state)
        .set({
            id,
            isInitialized: true
        });
}
const withCommandPagesNavigate: Reducer = ({ state, event }) => {
    console.log(event);
    return state;
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

        .reduce({ type: commonLanguage.commands.Pages.Navigate, event, callback: withCommandPagesNavigate })

        .reduce({ type: commonLanguage.queries.InsertNewWidgetContexts, event, callback: withQueryInsertNewWidgetContexts });
}

const commonLanguage = {
    commands: {
        Initialize: 'INITIALIZE',
        Connect: 'CONNECT',
        CompleteConnection: 'COMPLETE_CONNECTION',

        Widgets: {
            Add: 'WIDGETS:ADD',
            Remove: 'WIDGETS:REMOVE',
            Command: 'WIDGETS:COMMAND',
            Emit: 'WIDGETS:EMIT',
        },
        Pages: {
            Navigate: 'NAVIGATE'
        }
    },
    events: {
        Widgets: {
            Added: 'WIDGETS:ADDED',
            Emitted: 'WIDGETS:EMITTED',
            Removed: 'WIDGETS:REMOVED',
        },
        Pages: {
            Navigated: 'NAVIGATED'
        }
    },
    queries: {
        InsertNewWidgetContexts: 'INSERT_NEW_WIDGET_CONTEXTS',
        DispatchToWidget: 'DISPATCH_TO_WIDGET',
        InitializeWidgets: 'INITIALIZE_WIDGETS'
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