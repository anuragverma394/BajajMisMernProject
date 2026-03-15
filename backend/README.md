# Backend (Microservices)

This backend runs as a set of independent Node.js microservices under `backend/services/`.
The root `backend/server.js` launches each service in its own process.

## Structure
- `services/` microservices (each has its own `package.json` and `node_modules`)
- `shared/` cross-service utilities (config, db, middleware, utils)
- `scripts/` operational scripts (rebuild, start)
- `server.js` microservice launcher
- `start.js` compatibility shim for `scripts/start.js`
- `rebuild.js` compatibility shim for `scripts/rebuild.js`

## Typical commands
Run all services:
```
node server.js
```

Rebuild dependencies for all services:
```
node rebuild.js
```

Clean all service `node_modules` (keeps `package-lock.json` for reproducible installs):
```
node scripts/clean-node-modules.js
```
