import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

const withQueryGetBlock: Reducer = ({ state, event }) => {
    const rpcBlock = event.payload;

    const { height } = rpcBlock;

    if (height !== state.height + 1) {
        throw commonLanguage.errors.heightMustBeSequential;
    }

    console.log(height);
    return withState(state)
        .set({ height })
        .emit({
            type: commonLanguage.events.NewBlockReached,
            payload: height
        })
        .store(commonLanguage.storage.InsertOne, rpcBlock)
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
        .set({ height });
    //.query(commonLanguage.queries.GetByHeight, height + 1); // Request next block (if available) // this is commented out because this would be called on getinfo, no ned to guess if the other block exists
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
        GetByHeight: 'GET_BY_HEIGHT', //@todo notice that these are named the same.
    },
    storage: {
        InsertOne: 'INSERT_ONE',
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