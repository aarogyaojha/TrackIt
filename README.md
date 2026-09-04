# TrackIt

Multi-tenant ticketing and status-tracking SaaS for service businesses.

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10

## Local Development

Start the local MongoDB database using Docker Compose before starting the applications. TrackIt requires a MongoDB replica set (`rs0`) to support multi-document transactions (e.g. organization registration).

The `docker-compose.yml` configuration automatically provisions the replica set and initiates it via the `mongo-init` helper container on startup:

```bash
# Start MongoDB replica set in the background (cold start)
docker compose up -d

# Check replica set status (optional verification)
docker compose exec mongo mongosh --eval "rs.status()"

# Stop MongoDB
docker compose down
```

If bringing up MongoDB manually without the `mongo-init` container, initialize the replica set once with:

```bash
mongosh --eval "rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'localhost:27017' }] })"
```

### Development

```bash
# Install dependencies
npm install

# Start all workspaces in dev mode
npm run dev

# Or start individually
npm run dev --workspace=web
npm run start:dev --workspace=api
```

### Build

```bash
npm run build
```

### Lint & Test

```bash
npm run lint
npm run test
```
