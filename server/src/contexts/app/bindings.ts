import { dbStore } from '../../classes/adapters/mongodb/mongoDbInstance'
import appContext from './context'
import { ContextMap } from '../../classes/contexts/contextMap';

/**
 * Initial APP context binding. Initialize Versions db table (this is used for context version upgrades)
 */
const bindContexts = async (contextMap: ContextMap) => {
    const appContextStore = await contextMap.getContextStore({ id: 'APP' });

    const { registeredContext: app } = await appContextStore.register({
        context: appContext,
        storeEvents: true
    });

    const initCollections = async () => {
        const db = await dbStore.get();

        // Create unique index on versions collection (We use versions across contexts and event stores. They're used heavily for migration scripts)
        const contextVersion = await db.collection('versions').findOne({ id: app.id });
        if (!contextVersion) {
            console.log('Carver Framework started with clean db. Creating initial versions collection...');

            await db.collection('versions').createIndex({ id: 1 }, { unique: true }); // Create a unique index on versions

            await db.collection('versions').insertOne({ id: app.id, version: 1 }); // with version we can do easy update migrations
        }

        // Create unique index on event sequence tracking. Contexts can use these to store last replayed event id and resume from last replayed event by using this sequence on app start.
        //@todo remove? Don't think this is used anymore.
        const eventSequencesId = 'EVENT_SEQUENCES';
        const eventSequencesVersion = await db.collection('versions').findOne({ id: eventSequencesId });
        if (!eventSequencesVersion) {
            await db.collection('eventSequences').createIndex({ id: 1 }, { unique: true });

            await db.collection('versions').insertOne({ id: eventSequencesId, version: 1 });
        }

    }
    await initCollections();

    await app.dispatch({ type: appContext.commonLanguage.commands.Initialize });
}

export default {
    bindContexts
}