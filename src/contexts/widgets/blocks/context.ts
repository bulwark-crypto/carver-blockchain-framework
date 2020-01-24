import { Context } from '../../../classes/interfaces/context'
import { withState, Reducer } from '../../../classes/logic/withState'

const withInitialize: Reducer = ({ state, event }) => {
    if (state.isInitialized) {
        throw commonLanguage.errors.isAlreadyInitialized;
    }
    const { type, payload } = event;
    const { id, variant } = payload;

    return withState(state)
        .set({
            isInitialized: true,
            id,
            variant
        })
        .query(commonLanguage.queries.GetWidgetData);
}
const withQueryLatestBlockDetails: Reducer = ({ state, event }) => {
    const response = event.payload
    const { variant } = state;

    return withState(state)
        .emit({
            type: commonLanguage.events.Intialized,
            payload: {
                variant,
                ...response,
            }
        });
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: 'INITIALIZE', event, callback: withInitialize })
        .reduce({ type: 'LATEST_BLOCK_DETAILS', event, callback: withQueryLatestBlockDetails });
}

const commonLanguage = {
    queries: {
        GetWidgetData: 'GET_WIDGET_DATA'
    },
    events: {
        Intialized: 'INTIALIZED'
    },
    errors: {
        isAlreadyInitialized: 'You can only initialize state once'
    }
}

const initialState = {}

export default {
    initialState,
    reducer,
    commonLanguage
} as Context