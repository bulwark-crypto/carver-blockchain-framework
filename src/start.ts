import { dbStore } from './classes/adapters/mongodb/mongoDbInstance'
import { config } from '../config'

import appContext from './contexts/app/context'
import appBindings from './contexts/app/bindings'

import apiRestContext from './contexts/app/api/rest/context'
import apiRestBindings from './contexts/app/api/rest/bindings'

import apiSocketContext from './contexts/app/api/socket/context'
import apiSessionBindings from './contexts/app/api/session/bindings'

import apiSocketBindings from './contexts/app/api/socket/bindings'

import rpcGetInfoContext from './contexts/app/rpc/getInfo/context'
import rpcGetInfoBindings from './contexts/app/rpc/getInfo/bindings'

import rpcBlocksContext from './contexts/app/rpc/blocks/context'
import rpcBlocksBindings from './contexts/app/rpc/blocks/bindings'

import rpcTxsContext from './contexts/app/rpc/txs/context'
import rpcTxsBindings from './contexts/app/rpc/txs/bindings'

import utxosContext from './contexts/app/sync/utxos/context'
import utxosBindings from './contexts/app/sync/utxos/bindings'

import requiredMovementsContext from './contexts/app/sync/requiredMovements/context'
import requiredMovementsBindings from './contexts/app/sync/requiredMovements/bindings'

import addressesContext from './contexts/app/sync/addresses/context'
import addressesBindings from './contexts/app/sync/addresses/bindings'

import addressMovementsContext from './contexts/app/sync/addressMovements/context'
import addressMovementBindings from './contexts/app/sync/addressMovements/bindings'

import apiSessionContext from './contexts/app/api/session/context'

import { createContextMap } from './classes/contextMap'

const startApp = async (namespace: string) => {

  console.log('Starting Carver Blockchain Framework')

  await dbStore.initialize(config.db.url, config.db.dbName);
  console.log('Connected to database!');

  /*
  const getNamespaceContexts = () => {
    switch (namespace) {
      case 'APP':
        return {
          serveNet: true, // Serve via node-ipc
          contexts: [
            {
              context: appContext,
              bindings: appBindings,
              id: 'APP'
            }]
        }
      case 'CORE':
        return {
          serveNet: false, // Do not serve these via node-ipc (they will be created locally)
          contexts: [
            {
              context: rpcGetInfoContext,
              bindings: rpcGetInfoBindings,
              id: 'RPC_GETINFO'
            },
            {
              context: rpcBlocksContext,
              bindings: rpcBlocksBindings,
              id: 'RPC_BLOCKS'
            },
            {
              context: rpcTxsContext,
              bindings: rpcTxsBindings,
              id: 'RPC_TXS'
            },
            {
              context: apiRestContext,
              bindings: apiRestBindings,
              id: 'API_REST'
            },
            {
              context: apiSessionContext,
              bindings: apiSessionBindings,
              id: 'API_SESSION'
            },
            {
              context: apiSocketContext,
              bindings: apiSocketBindings,
              id: 'API_SOCKET'
            },
            {
              context: utxosContext,
              bindings: utxosBindings,
              id: 'UTXOS'
            },
            {
              context: requiredMovementsContext,
              bindings: requiredMovementsBindings,
              id: 'REQUIRED_MOVEMENTS'
            },
            {
              context: addressesContext,
              bindings: addressesBindings,
              id: 'ADDRESSES'
            },
            {
              context: addressMovementsContext,
              bindings: addressMovementBindings,
              id: 'ADDRESS_MOVEMENTS'
            }
          ]
        }
    }

    throw 'Unknown namespace';
  }


  const contexts = getNamespaceContexts();
  console.log('register context:', namespace);


  const contextStore = createContextStore({ id: namespace });
  for await (const { context, id } of contexts) {
    await contextStore.register({
      context,
      id
    });
  }

  for await (const { bindings } of contexts) {
    await bindings.bindContexts(contextStore as any);
  }
  const app = await contextStore.get(appContext);
  await app.dispatch({ type: appContext.commonLanguage.commands.Initialize })
  
*/

  const contextMap = await createContextMap(); // Initialized map with default RabbitMQ channel (from config)

  switch (namespace) {
    case 'APP': //@todo Perhaps this is not the best name (since APP contextStore contains APP context)
      {
        const appContextStore = await contextMap.getContextStore({ id: 'APP' });

        await appBindings.bindContexts(contextMap);




        const app = await appContextStore.getById('APP');
        await app.dispatch({ type: appContext.commonLanguage.commands.Initialize });
      }
      break;
    case 'SYNC':
      {
        const syncContextStore = await contextMap.getContextStore({ id: 'SYNC' });

        const appContextStore = await contextMap.getContextStore({ id: 'APP' })
        const app = await appContextStore.getById('APP');

      }
  }

  console.log(`[${namespace}] namespace started`)
}

if (process.argv.length < 3) {
  throw Error('Please pass in a namespace (ex: app) to start');
}

const namespace = process.argv[2];
startApp(namespace);