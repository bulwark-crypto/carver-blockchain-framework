import { RegisteredContext } from '../../classes/eventStore';
import { rpc } from '../../classes/libs/rpcInstance'
import { withContext } from '../../classes/logic/withContext';
import { ContextStore } from '../../classes/contextStore';

import appContext from './reducer'
import rpcGetInfoContext from './rpc/getInfo/reducer'

const bindContexts = async (contextStore: ContextStore) => {
}

export default {
    bindContexts
}