

import { RegisteredContext } from '../../contextDispatcher'
import { PermanentStore } from '../../interfaces/permanentStore'

interface CreatePermanentStore {
    id: string;
}
const createPermanentStore = ({ id }: CreatePermanentStore): PermanentStore => {
    console.log('register:', id);

    const store = async (objects: any) => {
        console.log('store:', objects);
    }

    return {
        store
    }
}

export {
    createPermanentStore
}