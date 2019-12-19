import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

const withQueryGetBlock: Reducer = ({ state, event }) => {
    const { response, error } = event.payload;

    //@todo also  checkRpcErrors
    if (error) {
        //@todo This function should only accept respones (no error). 
        console.log('REQUEST:GET_BLOCK error:', error);
        return state;
    }

    if (response.height !== state.height + 1) {
        throw commonLanguage.errors.heightMustBeSequential;
    }

    return withState(state)
        .set({ height: response.height })
        .emit(commonLanguage.events.NewBlockReached, response)
        .reduce({ event, callback: withCommandParseGetInfo });
}
const withCommandParseGetInfo: Reducer = ({ state, event }) => {

    // Take the height from rpc getblock response
    const { blocks } = event.payload;

    // Limit the blocks to sync to first 1000 (expand when event store is completed)
    if (state.height > 1000 || state.height >= blocks) {
        return state;
    }

    return withState(state)
        .query(commonLanguage.queries.GetBlockAtHeight, state.height + 1); // Request 
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.ParseGetInfo, event, callback: withCommandParseGetInfo })
        .reduce({ type: commonLanguage.queries.GetBlockAtHeight, event, callback: withQueryGetBlock });
}

const commonLanguage = {
    commands: {
        /**
         * Parse RPC getinfo results to fetch the block height from
         */
        ParseGetInfo: 'PARSE_GET_INFO'
    },
    events: {
        NewBlockReached: 'NEW_BLOCK_REACHED'
    },
    queries: {
        GetBlockAtHeight: 'GET_BLOCK_AT_HEIGHT'
    },
    errors: {
        heightMustBeSequential: 'Blocks must be sent in sequential order'
    }
}

const initialState = {
    height: 0
}

export default {
    initialState,
    reducer,
    commonLanguage
}