import { withContext } from '../../../../classes/logic/withContext';
import { ContextStore } from '../../../../classes/contexts/contextStore';

const bindContexts = async (contextStore: ContextStore) => {
    console.log('apiSocket bound')
}

export default {
    bindContexts
}