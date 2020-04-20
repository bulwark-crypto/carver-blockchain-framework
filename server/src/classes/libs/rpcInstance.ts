
import { config } from '../../../config'
import * as async from 'async';

interface RpcQueueTask {
    fn: string;
    params: any[];
    resolve: any;
    reject: any;
}

const createGlobalRpcInstance = () => {
    const rpcLib = require('node-bitcoin-rpc')
    rpcLib.init(config.rpc.host, config.rpc.port, config.rpc.username, config.rpc.password);

    const rpcQueue = async.queue<RpcQueueTask>((task, callback) => {
        const { fn, params, resolve, reject } = task;

        rpcLib.call(fn, params, (err: any, data: any) => {
            if (err || !!data.error) {
                console.log('Call failed', fn, err || data.error);

                const errorResult = err || data.error;
                const errorResponse = typeof errorResult === 'object' ? JSON.stringify(errorResult) : errorResult;

                reject(new Error(errorResponse));
            } else {
                resolve(data.result);
            }
            callback();
        });
    });

    return {
        call: (fn: string, params: any[] = []) => {
            if (!fn) {
                return Promise.reject(new Error('Please provide a rpc method name.'));
            }

            if (!params) {
                params = [];
            }

            return new Promise((resolve, reject) => {
                rpcQueue.push({ fn, params, resolve, reject })
            });
        }
    }
}


const globalInstance = createGlobalRpcInstance()
const createRpcInstance = () => {
    if (config.rpc.useSingleInstance) {
        return globalInstance;
    }

    const rpcInstance = createGlobalRpcInstance()
    return rpcInstance
}

export {
    createRpcInstance
}