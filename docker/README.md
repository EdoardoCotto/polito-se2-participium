# Docker Setup for Participium

This folder contains Docker configuration files for running the Participium application.

## For Developers (Compose + Publishing)

### Structure

- `docker-compose.yml` - Orchestrates db, backend, and frontend containers
- `Dockerfile.db` - Database container configuration (initializes SQLite)
- `Dockerfile.backend` - Backend container configuration
- `Dockerfile.frontend` - Frontend container configuration
- `init-db.sh` - Database initialization script
- `nginx.conf` - Nginx configuration for frontend
- `.dockerignore` - Files to exclude from Docker build context

### Prerequisites

- Docker
- Docker Compose (or `docker compose` command)

### Usage (Docker Compose workflow)

#### Build and Start Services

From the project root directory:

```bash
docker compose -f docker/docker-compose.yml up --build
```

Or from the `docker` directory:

```bash
docker compose up --build
```

#### Start Services in Background

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

#### Stop Services

```bash
docker compose -f docker/docker-compose.yml down
```

#### View Logs

```bash
docker compose -f docker/docker-compose.yml logs -f
```

#### Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api-docs

### Services

#### Database
- Container name: `participium-db`
- Database: SQLite (stored in Docker volume `db-data`)
- Purpose: Separate container that holds the database volume for persistence
- Note: The database initialization is done by the backend container, same as in the monolithic app

#### Backend
- Container name: `participium-backend`
- Port: 3001
- Database: Connects to SQLite database file in shared volume `db-data`
- Initialization: Runs `/server/db/init.js` on startup (same as monolithic app), then starts the server
- Dependencies: Waits for `db` container to start

#### Frontend
- Container name: `participium-frontend`
- Port: 5173 (mapped to nginx port 80)
- Build: Uses Vite to build the React app, then serves with nginx
- Proxy: Nginx proxies `/api` requests to the backend container

### Database

The SQLite database is stored in a Docker volume (`db-data`), which persists data between container restarts. The database is initialized by the `backend` container using `/server/db/init.js` on startup, exactly the same way as in the monolithic app. The database file is shared between the `db` and `backend` containers via the `db-data` volume.

### Notes

- The database initialization script runs when the `backend` container starts (using `server/db/init.js`), same as the monolithic app.
- If the database already exists, the schema will be recreated (tables are dropped and recreated).
- Database data persists in the `db-data` volume even after containers are stopped.
- To reset the database, remove the volume: `docker compose -f docker/docker-compose.yml down -v`
- The `db` container just maintains the volume - actual initialization happens in the backend container
- Frontend uses nginx to serve static files and proxy API requests to the backend

### Publishing Images to Docker Hub (release script)

Use the helper script to build all three images (`db`, `backend`, `frontend`) and push them to a single Docker Hub repository.

1. Log in once: `docker login`
2. From the repo root:  
   ```
   chmod +x docker/publish-dockerhub.sh
   ./docker/publish-dockerhub.sh --tag demo-2-release-1 --latest
   ```
   - `--tag` is mandatory (e.g. `v1.0.0`, `demo-2-release-1`).
   - `--latest` is optional; it additionally pushes `db-latest`, `backend-latest`, and `frontend-latest`.
   - `--repo <namespace/name>` overrides the default `neginmotaharifar/polito-se2-participium`.
3. Docker Hub ends up with tags such as:
   - `neginmotaharifar/polito-se2-participium:db-demo-2-release-1`
   - `neginmotaharifar/polito-se2-participium:backend-demo-2-release-1`
   - `neginmotaharifar/polito-se2-participium:frontend-demo-2-release-1`

## For End Users (Running Published Images)

Third parties who only want to run the published release can pull and start the containers without rebuilding:

```bash
# Replace TAG with the published version (e.g. demo-2-release-1)
TAG=demo-2-release-1

docker pull neginmotaharifar/polito-se2-participium:db-$TAG
docker pull neginmotaharifar/polito-se2-participium:backend-$TAG
docker pull neginmotaharifar/polito-se2-participium:frontend-$TAG

# Start containers (example using a shared Docker network + volume)
docker network create participium-net || true
docker volume create participium-db-data || true

docker run -d --name participium-db \
  --network participium-net \
  -v participium-db-data:/app/server/db \
  neginmotaharifar/polito-se2-participium:db-$TAG tail -f /dev/null

docker run -d --name participium-backend \
  --network participium-net \
  -p 3001:3001 \
  -v participium-db-data:/app/server/db \
  -e NODE_ENV=production \
  -e PORT=3001 \
  neginmotaharifar/polito-se2-participium:backend-$TAG

docker run -d --name participium-frontend \
  --network participium-net \
  -p 5173:80 \
  -e BACKEND_URL=http://participium-backend:3001 \
  neginmotaharifar/polito-se2-participium:frontend-$TAG
```

Once running:
- Frontend is available on `http://localhost:5173`
- Backend REST API on `http://localhost:3001`
- Swagger docs on `http://localhost:3001/api-docs`

### Using docker compose with published images

Instead of crafting the `docker run` commands manually, end users can create a small `docker-compose.yml` that references the public images. Example:

```yaml
services:
  db:
    image: neginmotaharifar/polito-se2-participium:db-demo-2-release-1
    container_name: participium-db
    volumes:
      - db-data:/app/server/db

  backend:
    image: neginmotaharifar/polito-se2-participium:backend-demo-2-release-1
    container_name: participium-backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    volumes:
      - db-data:/app/server/db
    depends_on:
      - db

  frontend:
    image: neginmotaharifar/polito-se2-participium:frontend-demo-2-release-1
    container_name: participium-frontend
    ports:
      - "5173:80"
    depends_on:
      - backend

volumes:
  db-data:
```

Save the file locally, replace the tag (`demo-2-release-1`) with the published version you want to run, then execute:

```bash
docker compose up -d
```

This gives the same result as pulling/running manually, while staying aligned with the release images on Docker Hub.

