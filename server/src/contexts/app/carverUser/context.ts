import { Context } from '../../../classes/interfaces/context'
import { withState, Reducer } from '../../../classes/logic/withState'


interface DispatchToWidgetPayload {
    id: string;
    payload: any;
}
export interface WidgetContext {
    id: string;
    variant: any;
}


const withQueryInsertNewWidgetContexts: Reducer = ({ state, event }) => {
    const newWidgetContexts = event.payload as WidgetContext[];
    const ids = newWidgetContexts.map(newWidgetContext => newWidgetContext.id);

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

const withQueryFindWidgetContextsOnPage: Reducer = ({ state, event }) => {
    const newWidgetContexts = event.payload as WidgetContext[];
    const ids = newWidgetContexts.map(newWidgetContext => newWidgetContext.id);

    return withState(state)
        .emit({
            type: commonLanguage.events.Widgets.Set,
            payload: newWidgetContexts
        })
        .set({
            widgetContexts: [
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
    const widgetIds = [id];

    return withState(state)
        .emit({
            type: commonLanguage.events.Widgets.Removed,
            payload: widgetIds
        })
        .query(commonLanguage.queries.RemoveWidgetContexts, widgetIds)
}

const withCommandWidgetsAdd: Reducer = ({ state, event }) => {
    const { variant } = event.payload;

    return withState(state)
        .query(commonLanguage.queries.InsertNewWidgetContexts, [{
            variant
        }])
}

/*
const withCommandConnect: Reducer = ({ state, event }) => {
    if (state.isConnected) {
        throw commonLanguage.errors.isAlreadyConnected;
    }

    //@todo emit 
    return withState(state)
        .set({ isConnected: true })
}*/

const withCommandInitialize: Reducer = ({ state, event }) => {
    if (state.isInitialized) {
        throw commonLanguage.errors.isAlreadyInitialized;
    }

    const { id } = event.payload;

    return withState(state)
        .set({
            id,
            isInitialized: true
        })
        .emit({ type: commonLanguage.events.Initialized })
        .query(commonLanguage.queries.FindWidgetContextsOnPage, { page: 'blocks' }); // As soon as carver user initializes navigate to blocks page
}
const withCommandPagesNavigate: Reducer = ({ state, event }) => {
    const { page } = event.payload;

    return withState(state)
        .query(commonLanguage.queries.FindWidgetContextsOnPage, { page })
}

const reducer: Reducer = ({ state, event }) => {
    //@todo add rate limit for incoming commands

    return withState(state)
        .reduce({ type: commonLanguage.commands.Initialize, event, callback: withCommandInitialize }) // This will be called by frontend
        //.reduce({ type: commonLanguage.commands.Connect, event, callback: withCommandConnect })

        .reduce({ type: commonLanguage.commands.Widgets.Add, event, callback: withCommandWidgetsAdd })
        .reduce({ type: commonLanguage.commands.Widgets.Remove, event, callback: withCommandWidgetsRemove })
        .reduce({ type: commonLanguage.commands.Widgets.Command, event, callback: withCommandWidgetsCommand })
        .reduce({ type: commonLanguage.commands.Widgets.Emit, event, callback: withCommandWidgetsEmit })

        .reduce({ type: commonLanguage.commands.Pages.Navigate, event, callback: withCommandPagesNavigate })

        .reduce({ type: commonLanguage.queries.InsertNewWidgetContexts, event, callback: withQueryInsertNewWidgetContexts })
        .reduce({ type: commonLanguage.queries.FindWidgetContextsOnPage, event, callback: withQueryFindWidgetContextsOnPage })

        ;
}

const commonLanguage = {
    type: 'CARVER_USER',
    commands: {
        Initialize: 'INITIALIZE',
        Connect: 'CONNECT',

        Widgets: {
            Add: 'WIDGETS:ADD',
            Remove: 'WIDGETS:REMOVE',
            Command: 'WIDGETS:COMMAND',
            Emit: 'WIDGETS:EMIT'
        },
        Pages: {
            Navigate: 'NAVIGATE'
        }
    },
    events: {
        Initialized: 'INITIALIZED',
        Widgets: {
            Added: 'WIDGETS:ADDED',
            Set: 'WIDGETS:SET',
            Emitted: 'WIDGETS:EMITTED',
            Removed: 'WIDGETS:REMOVED',
        },
        Pages: {
            Navigated: 'NAVIGATED'
        }
    },
    queries: {
        InsertNewWidgetContexts: 'INSERT_NEW_WIDGET_CONTEXTS',
        RemoveWidgetContexts: 'REMOVE_WIDGET_CONTEXTS',

        DispatchToWidget: 'DISPATCH_TO_WIDGET',
        InitializeWidgets: 'INITIALIZE_WIDGETS',
        FindWidgetContextsOnPage: 'FIND_WIDGET_CONTEXTS_ON_PAGE'
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
    widgetContexts: [] as WidgetContext[]
}

export default {
    initialState,
    reducer,
    commonLanguage
}