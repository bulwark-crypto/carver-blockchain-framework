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
            type: commonLanguage.events.Reset,
            payload: {
                id,
                widgets: []
            } // Emits publicState id to frontend
        });
}
const withCommandWidgetsAdd: Reducer = ({ state, event }) => {
    const { id, variant } = event.payload
    console.log('*** widgets add:', event)

    const widgets = [
        ...state.widgets,
        { id, variant }
    ];

    return withState(state)
        .set({
            widgets
        })
        .emit({
            type: commonLanguage.events.Appended, // Let frontend know that this id has a new state addition (think .push into array)
            payload: {
                id: state.id,
                widgets: [{ id, variant }]
            }
        });
}

const withCommandWidgetsInitialize: Reducer = ({ state, event }) => {
    const { id } = event;
    const initialState = event.payload

    return withState(state)
        .emit({
            type: commonLanguage.events.Appended,
            payload: {
                id: id,
                ...initialState     // Let frontend know that this id has a new state
            }
        });
}
const withCommandWidgetsUpdate: Reducer = ({ state, event }) => {
    const { id } = event;
    const newWidgetState = event.payload

    return withState(state)
        .emit({
            type: commonLanguage.events.Updated,
            payload: {
                id,
                newWidgetState
            } // Let frontend know that this id has a new state
        });
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.Initialize, event, callback: withCommandInitialize })
        .reduce({ type: commonLanguage.commands.Widgets.Add, event, callback: withCommandWidgetsAdd })
        .reduce({ type: commonLanguage.commands.Widgets.Initialize, event, callback: withCommandWidgetsInitialize })
        .reduce({ type: commonLanguage.commands.Widgets.Update, event, callback: withCommandWidgetsUpdate });
}

const commonLanguage = {
    commands: {
        Initialize: 'INITIALIZE',
        Widgets: {
            Add: 'WIDGETS:ADD',
            Initialize: 'WIDGETS:INITIALIZE',
            Update: 'WIDGETS:UPDATE',
        }
    },
    queries: {
    },
    events: {
        Reset: 'RESET',
        Updated: 'UPDATED',
        Appended: 'APPENDED',
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