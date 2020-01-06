import { createContextStore } from './classes/contextStore'

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

import apiSessionContext from './contexts/app/api/session/context'

import { withContext } from './classes/logic/withContext'

const start = async () => {

  console.log('Starting Carver Blockchain Framework')

  await dbStore.initialize(config.db.url, config.db.dbName);
  console.log('Connected to database!');

  const contextStore = createContextStore({ id: 'CORE' });

  // APP will initialize db structure
  const app = await contextStore.register({
    context: appContext,
    id: 'APP'
  });

  //@todo we can nest these inside the app context
  await contextStore.register({
    context: rpcGetInfoContext,
    id: 'RPC_GETINFO'
  });

  await contextStore.register({
    context: rpcBlocksContext,
    id: 'RPC_BLOCKS'
  });

  await contextStore.register({
    context: rpcTxsContext,
    id: 'RPC_TXS'
  });

  await contextStore.register({
    context: apiRestContext,
    id: 'API_REST'
  });

  await contextStore.register({
    context: apiSocketContext,
    id: 'API_SOCKET'
  });

  await contextStore.register({
    context: apiSessionContext,
    id: 'API_SESSION'
  });
  /*
    await contextStore.register({
      context: utxosContext,
      id: 'UTXOS'
    });
    await contextStore.register({
      context: requiredMovementsContext,
      id: 'REQUIRED_MOVEMENTS'
    });
  
    await contextStore.register({
      context: addressesContext,
      id: 'ADDRESSES'
    });*/

  // Bind all contexts 
  const contextBindings = [
    appBindings,
    rpcGetInfoBindings,
    rpcBlocksBindings,
    rpcTxsBindings,
    apiRestBindings,
    apiSessionBindings,
    apiSocketBindings,
    //utxosBindings,
    //requiredMovementsBindings,
    //addressesBindings
  ];
  for await (const contextBinding of contextBindings) {
    await contextBinding.bindContexts(contextStore as any);
  }

  await app.dispatch({ type: appContext.commonLanguage.commands.Initialize })
}

start();