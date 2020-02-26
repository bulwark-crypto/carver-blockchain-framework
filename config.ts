export const config = {
    rpc: {
        host: '127.0.0.1',
        port: '1355',
        username: 'RPCUSERNAME',
        password: 'RPCPASSWORD',
        timeoutMs: 8 * 1000, // 8 seconds
    },
    db: {
        url: 'mongodb://127.0.0.1:27017',

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
        }
    },
    /**
     * Default node-ipc settings
     */
    ipc: {
        networkHost: '127.0.0.1',
        networkPort: 8000,
        silent: false // set to false for debugging
    }
}