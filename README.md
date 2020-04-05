# Bulwark Carver Framework - WORK IN PROGRESS

Carver Framework is a next generation blockchain explorer and data aggregation network. It uses our new concept of distributed server-side reducers to create realtime data access layer. Each reducer context in this network can be accessed via separate event store and data can be permanently stored in database via event projections.

The framework currently features the world's most advanced Masternode / Proof Of Stake blockchain analytics via our Carver2D algorithm.

# Installation

Modify `.env` file and replace all "CHANGEME" lines with a random password. (This will be automated via a script in the future)

Install docker and run: `docker compose up -d`. At the moment you will also need to run `npm start SYNC` and `npm start API`.

You can access frontend on http://localhost:3000/ (this is automatically ran in "client" Docker container). You can see check out [Development & Commands](docs/development.md) for quick start.

# Help & Documentation

Documentation for this project is broken up into the following areas:

- [Development & Commands](docs/development.md)
- [Concepts](docs/concepts.md)