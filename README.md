# Bulwark Carver Framework (Server) - WORK IN PROGRESS

Carver Framework is a next generation blockchain explorer and data aggregation network. It uses our new concept of distributed server-side reducers to create realtime data access layer. Each reducer context in this network can be accessed via separate event store and data can be permanently stored in database via event projections.

The framework currently features the world's most advanced Masternode / Proof Of Stake blockchain analytics via our Carver2D algorithm.

This server repository is used to serve realtime data for consumption via [Carver Framework Client](https://github.com/bulwark-crypto/carver-blockchain-framework-client) repository which allows to project server-side managed state without any frontend state logic or rest apis. (This will be moved to this repository soon).

# Installation

Modify `.env` file and replace all "CHANGEME" lines with a random password. (This will be automated via a script in the future)

Install docker and run: `docker compose up` (you can use `-d` option to run it in background)

This will start up all of the required Carver Framework services.

You can now run the following commands on "reservation" container (These will be ran automatically in the future)

- `node src/start.js APP`
- `node src/start.js API`
- `node src/start.js SYNC` (This will require Bulwark chain to fully sync)

# Frontend Contexts

You will find all of the core logic for Carver Framework in the `server/src/contexts` folder.

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