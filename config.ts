export const config = {
    rpc: {
        host: '127.0.0.1',
        port: '1355',
        username: 'RPCUSERNAME',
        password: 'RPCPASSWORD',
        timeoutMs: 8 * 1000, // 8 seconds
    },
    db: {
        host: '127.0.0.1',
        port: '27017',
        name: 'blockex',
        username: 'blockexuser',
        password: 'Explorer!1'
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