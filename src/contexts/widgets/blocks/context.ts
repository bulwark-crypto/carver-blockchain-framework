import { Context } from '../../../classes/interfaces/context'
import { withState, Reducer } from '../../../classes/logic/withState'

const withInitialize: Reducer = ({ state, event }) => {
    if (state.isInitialized) {
        throw commonLanguage.isAlreadyInitialized;
    }
    const { type, payload } = event;
    const { id, variant } = payload;

    return withState(state)
        .set({
            isInitialized: true,
            id,
            variant
        })
        .query('LATEST_BLOCK_DETAILS');
}
const withQueryLatestBlockDetails: Reducer = ({ state, event }) => {
    const { response, error } = event.payload
    if (error) {
        console.log('REQUEST:GET_BLOCK error:', error);
        return state;
    }

    console.log('blockDetails', response);

    const { id, variant } = state;

    return withState(state)
        .emit('INITIALIZED', {
            variant,
            ...response,
        });
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: 'INITIALIZE', event, callback: withInitialize })
        .reduce({ type: 'LATEST_BLOCK_DETAILS', event, callback: withQueryLatestBlockDetails });
}

const commonLanguage = {
    isAlreadyInitialized: 'You can only initialize state once'
}

const initialState = {}

export default {
    initialState,
    reducer,
    commonLanguage
} as Context