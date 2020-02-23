# Bulwark Carver Framework (Server) - WORK IN PROGRESS

Carver Framework is a next generation blockchain explorer and data aggregation network. It uses our new concept of distributed server-side reducers to create realtime data access layer. Each reducer context in this network can be accessed via separate event store and data can be permanently stored in database via event projections.

The framework currently features the world's most advanced Masternode / Proof Of Stake blockchain analytics via our Carver2D algorithm.

This server repository is used to serve realtime data for consumption via [Carver Framework Client](https://github.com/bulwark-crypto/carver-blockchain-framework-client) repository which allows to project server-side managed state without any frontend state logic or rest apis.

# Installation

1. Install: `npm install`
2. Configure: `config.ts`
3. Run: `tsc | node src/start.js` (@todo make it work via npm start)

This will spawn a socket reservation REST server on port 3001 (this will soon be moved into config). This server will provide an endpoint to connect socket.io connection to with credentials.

You will also need to run [carver-blockchain-framework-client](https://github.com/bulwark-crypto/carver-blockchain-framework-client) repository for frontend.

# Frontend Contexts

## app/api/rest - Reservation Server

Starts HTTP reservation server (@todo add HTTPS). When a user opens up Carver Framework client (frontend) a single HTTP request is made to this context. 

A new reservation will be dispatched (via **app/api/session** context), if successful one of the socket servers is ready for socket.io(lib) connection. Server will respond with a unique id + uri (including socket) for socket.io to connect to.

## app/api/session - Socket Server

Session context listens to new incoming socket.io connections and initializes both **app/carverUser** and **app/api/publicState** contexts. 

## app/api/publicState - Server-Side Frontend State Rendering Management (In-Memory)

All *OUTGOING* events from socket.io are generated in this context. This context is responsible for keeping displayed state in sync with the actual system state.  

Events are streamed from **app/carverUser** context. Any time user context is updated (ex widget is added or widget is changed) publicState will be notified via dispatch. These events will be interperted and frontend state changes will be emitted via socket.io.

This is an "In-Memory" context because the emitted events are not stored (since they are emitted to frontend).

## app/carverUser - Frontend User Logic (In-Memory)

All *INCOMING* events from socket.io are processed in this context. This context manages the state of the connected user and all user-related **widgets/** contexts.

## widgets/ - Frontend User Widgets (In-Memory)

Events from widgets are streamed back to **app/carverUser**. Most of the frontend is composed of widgets which have access to ALL contexts in Carver Framework allowing for realtime interactions.

# Blockchain Sync Contexts

@todo

# Core Concepts

@todo