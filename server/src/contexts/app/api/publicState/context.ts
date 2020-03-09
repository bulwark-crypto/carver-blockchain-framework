import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'
import { WidgetContext } from '../../carverUser/context';

const withCommandInitialize: Reducer = ({ state, event }) => {
    if (state.isInitialized) {
        throw commonLanguage.errors.isAlreadyInitialized;
    }
    const { id } = event.payload;

    return withState(state)
        .set({
            isInitialized: true,
            id
        })
        .emit({
            type: commonLanguage.events.Updated,
            payload: [{
                type: commonLanguage.events.Pushed,
                id,
                parent: null,

                payload: {
                    variant: 'widgetsContainer'
                }
            }] // Emits publicState id to frontend
        });
}

const getWidgetContextsWithParent = (state: any, widgetContexts: any[]) => {
    return widgetContexts.map((widgetContext: any) => {
        const { id, variant } = widgetContext;
        return {
            type: commonLanguage.events.Pushed, // Let frontend know that this id has a new state addition (think .push into widgets array)
            id,
            parent: state.id,

            payload: {
                variant,
            }
        }
    })
}
const withCommandWidgetsAdd: Reducer = ({ state, event }) => {
    const widgetContexts = event.payload

    return withState(state)
        .set({
            widgets: [
                ...state.widgets,
                ...widgetContexts
            ]
        })
        .emit({
            type: commonLanguage.events.Updated,
            payload: getWidgetContextsWithParent(state, widgetContexts)
        });
}
const withCommandWidgetsRemove: Reducer = ({ state, event }) => {
    const widgetIdsToRemove = event.payload as string[];

    const widgets = (state.widgets as WidgetContext[]).reduce((widgets, widgetId) => {
        if (widgetIdsToRemove.find(widgetIdToRemove => widgetIdToRemove === widgetId.id)) {
            return widgets
        }
        return [...widgets, widgetId]
    }, []);

    return withState(state)
        .set({
            widgets
        })
        .emit({
            type: commonLanguage.events.Updated,
            payload: [{
                type: commonLanguage.events.Clear, // Delete objects from display ...
                payload: widgetIdsToRemove, // ... from these specific object ....
                id: state.id // ... in the root object
            },
            ]
        });
}
const withCommandWidgetsSet: Reducer = ({ state, event }) => {
    const widgetContexts = event.payload

    return withState(state)
        .set({
            widgets: [
                ...widgetContexts
            ]
        })
        .emit({
            type: commonLanguage.events.Updated,
            payload: [{
                type: commonLanguage.events.Clear,  // Delete objects from display ...
                id: state.id // ... in the root object
            },
            ...getWidgetContextsWithParent(state, widgetContexts)
            ]
        });
}

const withCommandWidgetsInitialize: Reducer = ({ state, event }) => {
    const { id } = event;
    const initialState = event.payload

    return withState(state)
        .emit({
            type: commonLanguage.events.Updated,
            payload: [{
                type: commonLanguage.events.Reduced, // Update these fields ....
                id, // ... in a specific object

                payload: {
                    ...initialState
                }
            }]
        });
}
const withCommandWidgetsUpdate: Reducer = ({ state, event }) => {
    const { id } = event;
    const newWidgetState = event.payload

    return withState(state)
        .emit({
            type: commonLanguage.events.Updated,
            payload: [{
                type: commonLanguage.events.Reduced,  // Update these fields ....
                id,// ... in a specific object

                payload: {
                    ...newWidgetState
                }
            }]
        });
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.Initialize, event, callback: withCommandInitialize })
        .reduce({ type: commonLanguage.commands.Widgets.Add, event, callback: withCommandWidgetsAdd })
        .reduce({ type: commonLanguage.commands.Widgets.Remove, event, callback: withCommandWidgetsRemove })
        .reduce({ type: commonLanguage.commands.Widgets.Set, event, callback: withCommandWidgetsSet })
        .reduce({ type: commonLanguage.commands.Widgets.Initialize, event, callback: withCommandWidgetsInitialize })
        .reduce({ type: commonLanguage.commands.Widgets.Update, event, callback: withCommandWidgetsUpdate });
}

const commonLanguage = {
    commands: {
        Initialize: 'INITIALIZE',
        Widgets: {
            Add: 'WIDGETS:ADD',
            Remove: 'WIDGETS:REMOVE',
            Set: 'WIDGETS:SET',
            Initialize: 'WIDGETS:INITIALIZE',
            Update: 'WIDGETS:UPDATE',
        }
    },
    queries: {
    },
    events: {
        Updated: 'UPDATED',

        Pushed: 'PUSHED', // Add to object id. Object { children:[{object},{object},{object}] }
        Reduced: 'REDUCED', // Update object by id
        Clear: 'CLEAR',
    },
    errors: {
        isAlreadyInitialized: 'You can only initialize state once'
    }
}

const initialState = {
    widgets: [] as any[]
}

export default {
    initialState,
    reducer,
    commonLanguage
}