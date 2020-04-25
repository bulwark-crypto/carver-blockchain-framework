# Bulwark Carver Framework - WORK IN PROGRESS

Carver Framework is a next generation blockchain explorer and data aggregation network. It uses our new concept of distributed server-side reducers to create realtime data access layer. Each reducer context in this network can be accessed via separate event store and data can be permanently stored in database via event projections.

The framework currently features the world's most advanced Masternode / Proof Of Stake blockchain analytics via our Carver2D algorithm.

# Installation

- Modify `.env` file and replace all "CHANGEME" lines with a random password. (This will be automated via a script in the future and there will be some safeguards to ensure you can't install with default passwords)
- Install Docker and run: `docker compose up -d`. 
- At the moment you will also need to run `docker-compose exec api bash -c "npm start API"` to start api server. (This will not be required in the future)
- Carver Framework ships with Bulwark Coin as default. Ensure it's synced up to the tip by running `docker-compose exec bwk bash -c "bulwark-cli -rpcconnect=172.25.0.110 getinfo"`
- Afer the api server above is loaded run `docker-compose exec sync bash -c "npm start SYNC"` to start sync server. (This will not be required in the future)

You can access frontend on http://localhost:3000/ (this is automatically ran in Docker "client" container). You can see check out [Development & Commands](docs/development.md) for quick start.

# Help & Documentation

Documentation for this project is broken up into the following areas:

- [Debugging, Development & Commands](docs/development.md)
- [Concepts](docs/concepts.md)