import { Coin } from "./src/contexts/app/carverUser/sharedInterfaces"

const api = {
    socket: {
        port: 5000,
        maxConnections: 256, // @todo
        maxReservations: 32, //@todo
        reservationTimeoutMs: 30 * 1000 // @todo
    },
    rest: {

    }
}


/**
 * @todo At the moment the coin is hard-coded in the server config. The plan is to move this out during cross-coin support.
 */
const coin: Coin = {
    name: 'Bulwark',
    shortName: 'BWK',
    displayDecimals: 2,
    formats: {
        amount: { fixedFormat: '0,0.00' },
        tooltip: { fixedFormat: '0,0.0000000000' },// Hovering over a number will show a larger percision tooltip
    },
    longName: 'Bulwark Cryptocurrency',
    websiteUrl: 'https://bulwarkcrypto.com/',
    masternodeCollateral: 5000 // MN ROI% gets based on this number. If your coin has multi-tiered masternodes then set this to lowest tier (ROI% will simply be higher for bigger tiers)
}

const rpc = {
    host: '172.25.0.110',
    port: '52547',
    username: process.env.RPC_USER, // Comes from .env file
    password: process.env.RPC_PASSWORD, // Comes from .env file
    timeoutMs: 30 * 1000, // 1 minute as the rpc call might be locked

    useSingleInstance: true  // If RPC stats to time out because of concurrency, set this to true (false is experimental)
}

export const config = {
    coin,
    rpc,
    db: {
        //@todo use env
        url: 'mongodb://172.25.0.102:27017',

        username: 'dbuser',
        password: 'dbpassword123!',

        dbName: 'carverFramework',
    },
    api,

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
            maxLength: 1000
        }
    },
}