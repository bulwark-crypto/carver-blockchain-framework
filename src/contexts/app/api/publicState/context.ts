import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

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
                type: commonLanguage.events.Clear, // Let frontend know that this id has a new state addition (think .push into widgets array)
                id: state.id,

                payload: []
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
                type: commonLanguage.events.Reduced, // Let frontend know that this id has a new state
                id,

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
                type: commonLanguage.events.Reduced,  // Let frontend know that this id has a new state
                id,

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
        .reduce({ type: commonLanguage.commands.Widgets.Set, event, callback: withCommandWidgetsSet })
        .reduce({ type: commonLanguage.commands.Widgets.Initialize, event, callback: withCommandWidgetsInitialize })
        .reduce({ type: commonLanguage.commands.Widgets.Update, event, callback: withCommandWidgetsUpdate });
}

const commonLanguage = {
    commands: {
        Initialize: 'INITIALIZE',
        Widgets: {
            Add: 'WIDGETS:ADD',
            Set: 'WIDGETS:SET',
            Initialize: 'WIDGETS:INITIALIZE',
            Update: 'WIDGETS:UPDATE',
        }
    },
    queries: {
    },
    events: {
        Updated: 'UPDATED',

        Pushed: 'PUSHED',
        Reduced: 'REDUCED',
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