import { Event, createEvent } from '../../../../classes/interfaces/events'
import { Context, State } from '../../../../classes/interfaces/context'
//import { withInit } from '../logic/withInit'
//import { withRpc } from '../logic/withRpc'
import { withUnhandledCommand, withUnhandledCommandPayload } from '../../../../classes/logic/knownErrors'
import { withState, Reducer } from '../../../../classes/logic/withState'

interface RpcPayload {
    res: any;
    err: any;
}

const checkRpcErrors = (err: string) => {
    if (!err) {
        return;
    }
    switch (typeof err) {
        case 'string':
            if (err.indexOf('ECONNREFUSED') === 0) {
                throw commonLanguage.ConnectionRefused;
            }
            switch (err) {
                case 'Timed out':
                    // These are BITCOIND_TIMEOUT errors and should be ignored as we'll get another error after
                    return;
                case 'socket hang up':
                    throw commonLanguage.SocketHangUp;
            }
            throw commonLanguage.UnhandledRpcError;
        case 'number':
            switch (err) {
                case 401:
                    throw commonLanguage.UnauthorizedCallResponseCode;
                default:
                    throw commonLanguage.UnhandledResponseCode;
            }
    }

}

const withAppInitialized: Reducer = ({ state, event }) => {
    return withState(state)
        .query('RPC_GETINFO');
}
const withQueryRpcGetinfo: Reducer = ({ state, event }) => {
    const { response, error } = event.payload;

    if (error) {
        console.log('REQUEST:GETINFO error:', error);
        return state;
    }

    //@todo also  checkRpcErrors

    return withState(state)
        .set({
            getInfo: response
        })
        .emit('RPC_GETINFO:UPDATED', response);
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: 'APP:INITIALIZED', event, callback: withAppInitialized })
        .reduce({ type: 'RPC_GETINFO', event, callback: withQueryRpcGetinfo });
}

const commonLanguage = {
    // Connection issues
    ConnectionRefused: 'Could not connect to RPC. Check your config host/port. (This is not a username/password issue).',
    SocketHangUp: 'RPC stocket hung up (Timeout). This usually occurs if the chain is still syncing. Please try again later.',

    // Compatability issues
    GetInfoUnsupportedFormat: 'RPC connected successfully but "getinfo" command returned data in unknown format.',

    // Unhandled errors
    UnhandledRpcError: 'RPC connected but returned unhandled RPC Error',
    UnauthorizedCallResponseCode: 'RPC connected but returned "Unauthorized (401)" error code. Check your config username/password.',
    UnhandledResponseCode: 'RPC connected but returned "Unauthorized (401)" error code. Check your config username/password.',

    ...withUnhandledCommand, // Add .UnhandledCommand error
    ...withUnhandledCommandPayload, // Add .withUnhandledCommandPayload error
}

const initialState = {
    blocks: 0
}

export default {
    initialState,
    reducer,
    commonLanguage
} as Context