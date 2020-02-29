import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

const withGetNextBlock: Reducer = ({ state, event }) => {

    // Limit the blocks to sync to first X (expand when event store is completed)
    if (state.height > 1000 || state.height >= state.blocks) {
        return state;
    }

    return withState(state)
        .query(commonLanguage.queries.GetByHeight, state.height + 1); // Request next block (if available)
}
const withQueryGetBlock: Reducer = ({ state, event }) => {
    const rpcBlock = event.payload;

    const { height } = rpcBlock;

    if (height !== state.height + 1) {
        throw commonLanguage.errors.heightMustBeSequential;
    }

    const date = new Date(rpcBlock.time * 1000);

    return withState(state)
        .set({ height })
        .emit({
            type: commonLanguage.events.NewBlockReached,
            payload: height
        })
        .store(commonLanguage.storage.InsertOne, {
            ...rpcBlock,
            date
        })
        .reduce({ callback: withGetNextBlock });
}

const withCommandSyncAtHeight: Reducer = ({ state, event }) => {
    // Event payload here is rpcBlock
    const { blocks } = event.payload;

    return withState(state)
        .set({ blocks })
        .reduce({ callback: withGetNextBlock });
}

const withCommandInitialize: Reducer = ({ state, event }) => {
    const { height } = event.payload;

    return withState(state)
        .set({ height });
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.Initialize, event, callback: withCommandInitialize })
        .reduce({ type: commonLanguage.commands.SyncAtHeight, event, callback: withCommandSyncAtHeight })
        .reduce({ type: commonLanguage.queries.GetByHeight, event, callback: withQueryGetBlock });
}

const commonLanguage = {
    type: 'RPC_BLOCKS',
    commands: {
        /**
         * Resume context with latest height
         */
        Initialize: 'INITIALIZE',

        /**
         * Continue syncing at specific height
         */
        SyncAtHeight: 'SYNC_AT_HEIGHT'
    },
    events: {
        NewBlockReached: 'NEW_BLOCK_REACHED'
    },
    queries: {
        GetByHeight: 'GET_BY_HEIGHT', //@todo notice that these are named the same.
    },
    storage: {
        InsertOne: 'INSERT_ONE',
        FindOneByHeight: 'FIND_ONE_BY_HEIGHT',
        FindManyByPage: 'FIND_MANY_BY_PAGE',
        FindCount: 'FIND_COUNT'
    },
    errors: {
        heightMustBeSequential: 'Blocks must be sent in sequential order'
    }
}

const initialState = {
    height: 0,
    blocks: 0
}

export default {
    initialState,
    reducer,
    commonLanguage
}