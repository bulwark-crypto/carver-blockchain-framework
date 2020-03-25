
export const config = {
    rpc: {
        host: '172.25.0.110',
        port: '52547',
        username: process.env.RPC_USER, // Comes from .env file
        password: process.env.RPC_PASSWORD, // Comes from .env file
        timeoutMs: 8 * 1000, // 8 seconds
    },
    db: {
        //@todo use env
        url: 'mongodb://172.25.0.102:27017',

        username: 'dbuser',
        password: 'dbpassword123!',

        dbName: 'carverFramework',
    },
    api: {
        socket: {
            port: 5000,
            maxConnections: 256, // @todo
            maxReservations: 32, //@todo
            reservationTimeoutMs: 30 * 1000 // @todo
        },
        rest: {

        }
    },
    rabbitmq: {
        url: 'amqp://172.25.0.103?heartbeat=5s' // from docker-compose.yml
    },
    nchan: {
        host: '172.25.0.101',
        port: 80
    },

    cache: {
        default: {
            /**
             * Default size of cached items in queue. Contexts can specify their own cache sizes but most will default to this max size. (ex: cache max 10,000 blocks)
             * Uses npm "double-ended-queue" internally
             */
            maxLength: 10000
        }
    },


    /**
     * Default node-ipc settings
     * @todo remove
     */
    ipc: {
        networkHost: '127.0.0.1',
        networkPort: 8000,
        silent: false // set to false for debugging (both server and client)
    },
}