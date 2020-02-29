import { MongoClient, Db } from 'mongodb'
import { config } from '../../../../config'

const createDbInstance = () => {
    let db = null as Db
    let client = null as MongoClient;

    const initialize = async (url: string, dbName: string) => {
        client = await MongoClient.connect(config.db.url, { useNewUrlParser: true, useUnifiedTopology: true });
        db = client.db(dbName);

        return db;
    }

    /**
     * Gets the default db schema.
     * @todo This might accept some options in the future
     */
    const get = async () => {
        return db;
    }

    const getClient = () => {
        return client
    }

    return {
        initialize,
        get,
        getClient
    }
}

const dbStore = createDbInstance();

export {
    dbStore
}