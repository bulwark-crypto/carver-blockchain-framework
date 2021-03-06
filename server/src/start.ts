import { dbStore } from './classes/adapters/mongodb/mongoDbInstance'
import { config } from '../config'

import appBindings from './contexts/app/bindings'

import apiRestBindings from './contexts/app/api/rest/bindings'

import apiUserStatsBindings from './contexts/app/api/userAnalytics/bindings'

import rpcGetInfoBindings from './contexts/app/rpc/getInfo/bindings'

import rpcBlocksBindings from './contexts/app/rpc/blocks/bindings'

import rpcTxsBindings from './contexts/app/rpc/txs/bindings'

import utxosBindings from './contexts/app/sync/utxos/bindings'

import requiredMovementsBindings from './contexts/app/sync/requiredMovements/bindings'

import addressesBindings from './contexts/app/sync/addresses/bindings'

import addressMovementBindings from './contexts/app/sync/addressMovements/bindings'


import { createContextMap } from './classes/contexts/contextMap'

const startNamespace = async (namespace: string) => {

  console.log('Starting Carver Blockchain Framework')

  await dbStore.initialize(config.db.url, config.db.dbName);
  console.log('Connected to database!');


  const contextMap = await createContextMap(); // Initialized map with default RabbitMQ channel (from config)

  switch (namespace) {
    case 'APP': //@todo Perhaps this is not the best name (since APP contextStore contains APP context)
      {
      }
      break;
    case 'SYNC':
      {
        await rpcGetInfoBindings.bindContexts(contextMap);
        await rpcBlocksBindings.bindContexts(contextMap);
        await rpcTxsBindings.bindContexts(contextMap);
        await utxosBindings.bindContexts(contextMap);
        await requiredMovementsBindings.bindContexts(contextMap);
        await addressesBindings.bindContexts(contextMap);
        await addressMovementBindings.bindContexts(contextMap);
      }
      break;
    case 'API':
      {
        await appBindings.bindContexts(contextMap);

        await apiRestBindings.bindContexts(contextMap);
        await apiUserStatsBindings.bindContexts(contextMap);
      }
      break;
  }

  console.log(`[${namespace}] namespace started`)
}

if (process.argv.length < 3) {
  throw Error('Please pass in a namespace (ex: app) to start');
}

const namespace = process.argv[2];
startNamespace(namespace);