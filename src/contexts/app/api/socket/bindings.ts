import { RegisteredContext } from '../../../../classes/contexts/contextStore';
import { withContext } from '../../../../classes/logic/withContext';
import { ContextStore } from '../../../../classes/contexts/contextStore';

const bindContexts = async (contextStore: ContextStore) => {
    console.log('apiSocket bound')
}

export default {
    bindContexts
}