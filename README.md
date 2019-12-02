# Bulwark Carver Framework (Server) - WORK IN PROGRESS

1. Install: `npm install`
2. Configure: `config.ts`
3. Run: `tsc | node src/start.js` (@todo make it work via npm start)

This will spawn a socket reservation REST server on port 3001 (this will soon be moved into config). This server will provide an endpoint to connect socket.io connection to with credentials.

You will also need to run `carver-blockchain-framework-client` for frontend.