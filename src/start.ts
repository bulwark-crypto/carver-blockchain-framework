import { createContextStore } from './classes/contextStore'
import { createEvent, CreateEventParams } from './classes/interfaces/events'
import { Context } from './classes/interfaces/context'

import apiRestBindings from './contexts/app/api/rest/bindings'
import apiSessionBindings from './contexts/app/api/session/bindings'
import apiSocketBindings from './contexts/app/api/socket/bindings'

import rpcGetInfoBindings from './contexts/app/rpc/getInfo/bindings'
import rpcBlocksBindings from './contexts/app/rpc/blocks/bindings'
import rpcTxsBindings from './contexts/app/rpc/txs/bindings'

import appContext from './contexts/app/reducer'
import rpcContext from './contexts/app/rpc/getInfo/context'
import rpcBlocksContext from './contexts/app/rpc/blocks/context'
import rpcTxsContext from './contexts/app/rpc/txs/context'

import apiSessionContext from './contexts/app/api/session/context'
import apiRestContext from './contexts/app/api/rest/context'
import apiSocketContext from './contexts/app/api/socket/context'

import { withContext } from './classes/logic/withContext'

const start = async () => {

  console.log('Starting Carver Blockchain Framework')

  const contextStore = createContextStore({ id: 'CORE' });

  const app = await contextStore.register({
    context: appContext,
    id: 'APP'
  });

  //@todo we can nest these inside the app context
  const rpcGetInfo = await contextStore.register({
    context: rpcContext,
    id: 'RPC:GETINFO'
  });

  const rpcBlocks = await contextStore.register({
    context: rpcBlocksContext,
    id: 'RPC:GETINFO'
  });

  const rpcTxs = await contextStore.register({
    context: rpcTxsContext,
    id: 'RPC:TXS'
  });

  const apiRest = await contextStore.register({
    context: apiRestContext,
    id: 'API:REST'
  });

  const apiSocket = await contextStore.register({
    context: apiSocketContext,
    id: 'API:SOCKET'
  });

  const apiSession = await contextStore.register({
    context: apiSessionContext,
    id: 'API:SESSION'
  });

  // Bind all contexts 
  const contextBindings = [rpcGetInfoBindings, rpcBlocksBindings, rpcTxsBindings, apiRestBindings, apiSessionBindings, apiSocketBindings];
  for await (const contextBinding of contextBindings) {
    await contextBinding.bindContexts(contextStore as any);
  }

  await withContext(app).emit('APP:INITIALIZE')
}

start();