import { rpc } from '../../classes/libs/rpcInstance'
import { withContext } from '../../classes/logic/withContext';
import { ContextStore } from '../../classes/contextStore';

import { dbStore } from '../../classes/adapters/mongodb/mongoDbInstance'
import appContext from './context'

const bindContexts = async (contextStore: ContextStore) => {
    const app = await contextStore.get(appContext);

    const db = await dbStore.get();

    /**
     * Create unique index on versions collection (We use versions across contexts and event stores. They're used heavily for migration scripts)
     */
    const initCollections = async () => {
        const contextVersion = await db.collection('versions').findOne({ id: app.id });
        if (!contextVersion) {
            await db.collection('versions').createIndex({ id: 1 }, { unique: true }); // Create a unique index on versions

            await db.collection('versions').insertOne({ id: app.id, version: 1 }); // with version we can do easy update migrations
        }

    }
    await initCollections();
}

export default {
    bindContexts
}