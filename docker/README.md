# Docker Setup for Participium

This folder contains Docker configuration files for running the Participium application.

## Structure

- `docker-compose.yml` - Orchestrates db, backend, and frontend containers
- `Dockerfile.db` - Database container configuration (initializes SQLite)
- `Dockerfile.backend` - Backend container configuration
- `Dockerfile.frontend` - Frontend container configuration
- `init-db.sh` - Database initialization script
- `nginx.conf` - Nginx configuration for frontend
- `.dockerignore` - Files to exclude from Docker build context

## Prerequisites

- Docker
- Docker Compose (or `docker compose` command)

## Usage

### Build and Start Services

From the project root directory:

```bash
docker compose -f docker/docker-compose.yml up --build
```

Or from the `docker` directory:

```bash
docker compose up --build
```

### Start Services in Background

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

### Stop Services

```bash
docker compose -f docker/docker-compose.yml down
```

### View Logs

```bash
docker compose -f docker/docker-compose.yml logs -f
```

### Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api-docs

## Services

### Database
- Container name: `participium-db`
- Database: SQLite (stored in Docker volume `db-data`)
- Purpose: Separate container that holds the database volume for persistence
- Note: The database initialization is done by the backend container, same as in the monolithic app

### Backend
- Container name: `participium-backend`
- Port: 3001
- Database: Connects to SQLite database file in shared volume `db-data`
- Initialization: Runs `/server/db/init.js` on startup (same as monolithic app), then starts the server
- Dependencies: Waits for `db` container to start

### Frontend
- Container name: `participium-frontend`
- Port: 5173 (mapped to nginx port 80)
- Build: Uses Vite to build the React app, then serves with nginx
- Proxy: Nginx proxies `/api` requests to the backend container

## Database

The SQLite database is stored in a Docker volume (`db-data`), which persists data between container restarts. The database is initialized by the `backend` container using `/server/db/init.js` on startup, exactly the same way as in the monolithic app. The database file is shared between the `db` and `backend` containers via the `db-data` volume.

## Notes

- The database initialization script runs when the `backend` container starts (using `server/db/init.js`), same as the monolithic app.
- If the database already exists, the schema will be recreated (tables are dropped and recreated).
- Database data persists in the `db-data` volume even after containers are stopped.
- To reset the database, remove the volume: `docker compose -f docker/docker-compose.yml down -v`
- The `db` container just maintains the volume - actual initialization happens in the backend container
- Frontend uses nginx to serve static files and proxy API requests to the backend

