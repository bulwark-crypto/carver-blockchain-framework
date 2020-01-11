
import { config } from '../../../config'

const createRpcInstance = () => {
    const rpcLib = require('node-bitcoin-rpc')
    rpcLib.init(config.rpc.host, config.rpc.port, config.rpc.username, config.rpc.password);

    let callsQueue: any[] = []
    let processing = false;

    return {
        call: (fn: string, params: any[] = []) => {
            if (!fn) {
                return Promise.reject(new Error('Please provide a rpc method name.'));
            }

            if (!params) {
                params = [];
            }

            const callNext = () => {
                if (callsQueue.length === 0) {
                    return;
                }

                const { fn, params, resolve, reject } = callsQueue.shift();

                processing = true;
                rpcLib.call(fn, params, (err: any, data: any) => {
                    processing = false;

                    if (err || !!data.error) {
                        console.log('Call failed', fn, err || data.error);

                        const errorResult = err || data.error;
                        const errorResponse = typeof errorResult === 'object' ? JSON.stringify(errorResult) : errorResult;

                        reject(new Error(errorResponse));
                    } else {
                        resolve(data.result);
                    }

                    callNext();
                });
            }

            const addCallToQueue = (resolve: any, reject: any) => {
                const queueItem = { fn, params, resolve, reject }

                callsQueue.push(queueItem);
                if (processing) {
                    return;
                }

                callNext();

            }

            return new Promise((resolve, reject) => {
                addCallToQueue(resolve, reject);
            });
        }
    }
}


const globalInstance = createRpcInstance()
const useGlobalInstance = () => {
    return globalInstance;
}
//const rpc = createRpcInstance()

export {
    createRpcInstance: useGlobalInstance
}