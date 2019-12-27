import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

const withQueryGetBlock: Reducer = ({ state, event }) => {
    const { response: block, error } = event.payload;


    //@todo also  checkRpcErrors
    if (error) {
        //@todo This function should only accept respones (no error). 
        console.log('REQUEST:GET_BLOCK error:', error);
        return state;
    }

    const { height } = block;

    if (height !== state.height + 1) {
        throw commonLanguage.errors.heightMustBeSequential;
    }

    console.log(height);
    return withState(state)
        .set({ height })
        .emit(commonLanguage.events.NewBlockReached, height)
        .store(commonLanguage.storage.AddOne, block)
        .reduce({ event, callback: withCommandParseGetInfo });
}
const withCommandParseGetInfo: Reducer = ({ state, event }) => {

    // Take the height from rpc getblock response
    const { blocks } = event.payload;

    // Limit the blocks to sync to first 1000 (expand when event store is completed)
    if (state.height > 20 || state.height >= blocks) {
        return state;
    }

    return withState(state)
        .query(commonLanguage.queries.GetByHeight, state.height + 1); // Request next block (if available)
}
const withCommandInitialize: Reducer = ({ state, event }) => {
    const { height } = event.payload;

    return withState(state)
        .set({ height })
        .query(commonLanguage.queries.GetByHeight, height + 1); // Request next block (if available)
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.Initialize, event, callback: withCommandInitialize })
        .reduce({ type: commonLanguage.commands.ParseGetInfo, event, callback: withCommandParseGetInfo })
        .reduce({ type: commonLanguage.queries.GetByHeight, event, callback: withQueryGetBlock });
}

const commonLanguage = {
    commands: {
        /**
         * Resume context with latest height
         */
        Initialize: 'INITIALIZE',
        /**
         * Parse RPC getinfo results to fetch the block height from
         */
        ParseGetInfo: 'PARSE_GET_INFO'
    },
    events: {
        NewBlockReached: 'NEW_BLOCK_REACHED'
    },
    queries: {
        GetByHeight: 'GET_BY_HEIGHT',
    },
    storage: {
        AddOne: 'ADD_ONE',
        GetByHeight: 'GET_BY_HEIGHT',
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