import { MongoClient, Db } from 'mongodb'
import { config } from '../../../../config'

const createDbInstance = () => {
    let db = null as Db

    const initialize = async (url: string, dbName: string) => {
        const client = await MongoClient.connect(config.db.url, { useNewUrlParser: true, useUnifiedTopology: true });
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

    return {
        initialize,
        get
    }
}

const dbStore = createDbInstance();

export {
    dbStore
}