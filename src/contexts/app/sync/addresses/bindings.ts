import { RegisteredContext } from '../../../../classes/contextStore';
import { rpc } from '../../../../classes/libs/rpcInstance'
import { withContext } from '../../../../classes/logic/withContext';
import { ContextStore } from '../../../../classes/contextStore';
import { dbStore } from '../../../../classes/adapters/mongodb/mongoDbInstance'

import addressesContext from './context'
import requiredMovementsContext from '../requiredMovements/context'

const bindContexts = async (contextStore: ContextStore) => {
    const requiredMovements = await contextStore.get(requiredMovementsContext);
    const addresses = await contextStore.get(addressesContext);

    const db = await dbStore.get();

    /*
    const initCollections = async () => {
        const contextVersion = await db.collection('versions').findOne({ id: addresses.id });
        if (!contextVersion) {
            await db.collection('addresses').createIndex({ label: 1 }, { unique: true });

            await db.collection('versions').insertOne({ id: addresses.id, version: 1 });
        }
    }
    await initCollections();
    */

    withContext(requiredMovements)
        .streamEvents({
            type: requiredMovementsContext.commonLanguage.events.TxParsed, callback: async (event) => {
                //@todo

                //await withContext(addresses).dispatch({ type: addressesContext.commonLanguage.commands.ParseRequiredMovements, payload: event.payload });
            }
        });
}

export default {
    bindContexts
}