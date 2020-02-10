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
            type: commonLanguage.events.Intialized,
            payload: initialState // Emits empty state to frontend
        });
}
const withCommandWidgetsAdd: Reducer = ({ state, event }) => {
    const { id } = event;
    const widgetState = event.payload

    console.log('add widget:', id, widgetState);

    return withState(state)
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.Initialize, event, callback: withCommandInitialize })
        .reduce({ type: commonLanguage.commands.Widgets.Add, event, callback: withCommandWidgetsAdd });
}

const commonLanguage = {
    commands: {
        Initialize: 'INITIALIZE',
        Widgets: {
            Add: 'WIDGETS:ADD'
        }
    },
    queries: {
    },
    events: {
        Intialized: 'INTIALIZED'
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