# TrackIt

Multi-tenant ticketing and status-tracking SaaS for service businesses.

## Getting Started

### Prerequisites
- Node.js >= 20
- npm >= 10

## Local Development

Start the local MongoDB database using Docker Compose before starting the applications:

```bash
# Start MongoDB in the background
docker compose up -d

# Stop MongoDB
docker compose down
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

