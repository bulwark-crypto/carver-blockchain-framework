import * as Deque from 'double-ended-queue'
import { config } from '../../../config'

interface InsertParams {
    data: any;
    keys: any[];
}
interface FindParams {
    key: any;
    miss: () => Promise<any>;
}
const initCache = () => {
    const maxLength = config.cache.default.maxLength;

    const cache = new Deque<any>();
    const keyCache = new Map<string, any>();

    const insert = ({ data, keys }: InsertParams) => {
        keys.map(key => JSON.stringify(key)).forEach(key => {
            if (cache.length > maxLength) {
                const { key: removedKey } = cache.shift();
                keyCache.delete(removedKey);
            }

            cache.push({
                data,
                key
            });
            keyCache.set(key, data);
        })
    }

    const find = async ({ key, miss }: FindParams) => {
        const jsonKey = JSON.stringify(key);
        if (keyCache.has(jsonKey)) {
            return keyCache.get(jsonKey);
        }

        const data = await miss();
        insert({ data, keys: [key] })

        return data;
    }

    return {
        insert,
        find
    }
}

export {
    initCache
}