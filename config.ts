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
            maxConnections: 256,
            maxReservations: 10000,
            reservationTimeoutMs: 30 * 1000
        }
    },
}