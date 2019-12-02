
import { config } from '../../../config'

const createRpcInstance = () => {
    const rpcLib = require('node-bitcoin-rpc')
    rpcLib.init(config.rpc.host, config.rpc.port, config.rpc.username, config.rpc.password);

    return {
        call: (fn: string, params: any[] = []) => {
            if (!fn) {
                return Promise.reject(new Error('Please provide a rpc method name.'));
            }

            if (!params) {
                params = [];
            }

            return new Promise((resolve, reject) => {
                rpcLib.call(fn, params, (err: any, data: any) => {
                    if (err || !!data.error) {
                        console.log('Call failed', fn, err || data.error);

                        const errorResult = err || data.error;
                        const errorResponse = typeof errorResult === 'object' ? JSON.stringify(errorResult) : errorResult;

                        reject(new Error(errorResponse));
                        return;
                    }

                    resolve(data.result);
                });
            });
        }
    }
}
const rpc = createRpcInstance()

export {
    rpc
}