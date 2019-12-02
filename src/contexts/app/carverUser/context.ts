import { Context } from '../../../classes/interfaces/context'
import { withState, Reducer } from '../../../classes/logic/withState'

const withInitialize: Reducer = ({ state, event }) => {
    if (state.isInitialized) {
        throw errors.isAlreadyInitialized;
    }

    const { id } = event.payload;

    return withState(state).set({ id, isInitialized: true });
}
const withRequestStats: Reducer = ({ state, event }) => {
    return withState(state)
}
const withConnected: Reducer = ({ state, event }) => {
    if (state.isConnected) {
        throw errors.isAlreadyConnected;
    }


    //@todo emit 
    return withState(state)
        .request('REQUEST:STATS')
        .set({ isConnected: true })
}
const withWidgetsAdd: Reducer = ({ state, event }) => {
    const widget = event.payload;

    return withState(state)
        .request('REQUEST:NEW_WIDGET_CONTEXT', { ...widget, id: state.widgetContexts.length })
}
const withRequestNewWidgetContext: Reducer = ({ state, event }) => {
    const { response, error } = event.payload;

    //@todo also  checkRpcErrors
    if (error) {
        console.log('REQUEST:GET_BLOCK error:', error);
        return state;
    }

    return withState(state)
        .set({ widgetContexts: [...state.widgetContexts, response] })

}
const withWidgetEmitted: Reducer = ({ state, event }) => {
    //@todo add rate limit

    return withState(state)
        .emit('WIDGET:EMITTED', event.payload);
}
const withWidgetsRemove: Reducer = ({ state, event }) => {
    const { id } = event.payload;

    return withState(state)
        .emit('WIDGET:REMOVED', { id });
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: 'INITIALIZE', event, callback: withInitialize })
        .reduce({ type: 'CONNECTED', event, callback: withConnected })
        .reduce({ type: 'REQUEST:STATS', event, callback: withRequestStats })
        .reduce({ type: 'WIDGETS:ADD', event, callback: withWidgetsAdd })
        .reduce({ type: 'WIDGETS:REMOVE', event, callback: withWidgetsRemove })
        .reduce({ type: 'WIDGET:EMITTED', event, callback: withWidgetEmitted })
        .reduce({ type: 'REQUEST:NEW_WIDGET_CONTEXT', event, callback: withRequestNewWidgetContext })
        ;
}

const errors = {
    isAlreadyInitialized: 'You can only initialize state once',
    isAlreadyConnected: 'You can only emit CONNECTED once',
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
    errors
} as Context