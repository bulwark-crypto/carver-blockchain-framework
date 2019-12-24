import { RegisteredContext } from '../../../../classes/contextStore';
import { rpc } from '../../../../classes/libs/rpcInstance'
import { withContext } from '../../../../classes/logic/withContext';
import { ContextStore } from '../../../../classes/contextStore';

const bindContexts = async (contextStore: ContextStore) => {
    console.log('apiSocket bound')
}

export default {
    bindContexts
}