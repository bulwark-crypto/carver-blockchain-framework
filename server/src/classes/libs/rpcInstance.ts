
import { config } from '../../../config'
import * as async from 'async';
import * as uuidv4 from 'uuid/v4'

interface RpcQueueTask {
    method: string;
    params: any[];
    resolve: any;
    reject: any;
}

import axios from "axios";

const createGlobalRpcInstance = () => {
    const axiosInstance = axios.create();
    const { host, port, username, password } = config.rpc

    const id = uuidv4() // Each instantce will get it's own unique id for rpc calls

    const rpcEndpoint = `http://${host}:${port}/`;
    const auth = { username, password }

    const rpcQueue = async.queue<RpcQueueTask>(async (task, callback) => {
        const { method, params, resolve, reject } = task;

        try {
            const postData = JSON.stringify({
                method,
                params,
                id
            })
            const response = await axiosInstance.post(rpcEndpoint, postData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': postData.length
                },
                auth
            });
            resolve(response.data.result);
        } catch (err) {
            reject(err);
        }
        callback();

        //@todo timeout
    });

    return {
        call: <T>(method: string, params: any[] = []) => {
            if (!method) {
                return Promise.reject(new Error('Please provide a rpc method name.'));
            }

            if (!params) {
                params = [];
            }

            return new Promise<T>((resolve, reject) => {
                rpcQueue.push({ method, params, resolve, reject })
            });
        }
    }
}


let globalInstance: ReturnType<typeof createGlobalRpcInstance> = null
const createRpcInstance = () => {
    if (config.rpc.useSingleInstance) {
        if (globalInstance == null) {
            globalInstance = createGlobalRpcInstance()
        }
        return globalInstance;
    }

    const rpcInstance = createGlobalRpcInstance()
    return rpcInstance
}

// The RPC interfaces below is the mininmum required supported shape for Carver Framework. 
// If your getinfo looks different, you will have to modify functionality in the framework.

export interface RpcGetinfoResponse {
    blocks: number;
}
export interface RpcBlockResponse {
    height: number;
}

export {
    createRpcInstance
}