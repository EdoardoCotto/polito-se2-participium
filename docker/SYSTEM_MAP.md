# Participium System Architecture Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                              │
│                    http://localhost:5173                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ HTTP Requests (HTML, JS, CSS)
                             │
                ┌────────────▼────────────┐
                │   FRONTEND CONTAINER    │
                │  (participium-frontend) │
                │                         │
                │  ┌──────────────────┐  │
                │  │   Nginx Server   │  │ Port: 5173 (host) → 80 (container)
                │  │   (Port 80)      │  │
                │  └──────────────────┘  │
                │         │               │
                │         │ 1. Serves React App (static files)        │
                │         │    from /usr/share/nginx/html            │
                │         │                                             │
                │         │ 2. Proxies /api requests                  │
                │         ▼                                             │
                │  ┌────────────────────────────────────────┐         │
                │  │  • Serves built React app (Vite build) │         │
                │  │  • SPA routing (all routes → index.html)│         │
                │  │  • Proxies /api → backend:3001/api     │         │
                │  └────────────────────────────────────────┘         │
                └─────────────────┬────────────────────────────────────┘
                                  │
                                  │ /api/* requests (proxied)
                                  │
                ┌─────────────────▼─────────────────┐
                │   BACKEND CONTAINER               │
                │  (participium-backend)            │
                │                                   │
                │  ┌──────────────────────────┐    │
                │  │   Express.js Server      │    │ Port: 3001
                │  │   (Node.js 20)           │    │
                │  └──────────────────────────┘    │
                │         │                         │
                │         │                         │
                │  ┌──────▼──────────────────────┐ │
                │  │  Routes:                    │ │
                │  │  • /api/sessions           │ │
                │  │  • /api/users              │ │
                │  │  • /api/reports            │ │
                │  │  • /api/categories         │ │
                │  │  • /api-docs (Swagger)     │ │
                │  │  • /static (static files)  │ │
                │  └──────┬──────────────────────┘ │
                │         │                        │
                │         │ Reads/Writes Database  │
                │         │                        │
                └─────────┼────────────────────────┘
                          │
                          │ SQLite Database File
                          │ (participium.db)
                          │
        ┌─────────────────▼─────────────────┐
        │      SHARED VOLUME (db-data)      │
        │  /app/server/db/participium.db    │
        │                                   │
        │  • Persists data between restarts │
        │  • Shared between db & backend    │
        └─────────────────┬─────────────────┘
                          │
                          │ Volume Mount
                          │
                ┌─────────▼─────────┐
                │   DB CONTAINER    │
                │ (participium-db)  │
                │                   │
                │  • Holds volume   │
                │  • Keeps it alive │
                │  • No active DB   │
                │    operations     │
                └───────────────────┘


┌──────────────────────────────────────────────────────────────────────┐
│                        STARTUP FLOW                                  │
└──────────────────────────────────────────────────────────────────────┘

1. DB Container starts
   └─> Creates/mounts db-data volume at /app/server/db
   └─> Keeps running (tail -f /dev/null)

2. Backend Container starts (depends on db)
   └─> Copies init.js and schema.sql to /app/server/db/
   └─> Runs: node db/init.js (initializes SQLite database)
   └─> Runs: node index.js (starts Express server on port 3001)

3. Frontend Container starts (depends on backend)
   └─> Builds React app with Vite
   └─> Serves static files via Nginx on port 80
   └─> Proxies /api requests to backend:3001


┌──────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                                     │
└──────────────────────────────────────────────────────────────────────┘

User Request Flow:
  Browser → Frontend (nginx) → Backend (Express) → SQLite Database
                                              ↑
                                              │
                                         (reads/writes)
                                              │
                                        Volume (db-data)

API Request Flow:
  Browser (http://localhost:5173/api/*)
    ↓
  Nginx (proxies to http://backend:3001/api/*)
    ↓
  Express.js (handles request, processes)
    ↓
  SQLite (reads/writes participium.db)
    ↓
  Response flows back through the chain


┌──────────────────────────────────────────────────────────────────────┐
│                        KEY COMPONENTS                                │
└──────────────────────────────────────────────────────────────────────┘

📦 Containers:
   • participium-db: Database volume holder
   • participium-backend: Node.js/Express API server
   • participium-frontend: Nginx web server with React app

💾 Volumes:
   • db-data: Persistent storage for SQLite database file

🌐 Network:
   • Docker Compose creates internal network
   • Containers communicate via service names (backend, db)

🔌 Ports Exposed:
   • 5173 → Frontend (nginx port 80)
   • 3001 → Backend (Express port 3001)

📁 File Structure in Containers:
   
   Backend Container:
   /app/server/
     ├── index.js (Express server)
     ├── db/
     │   ├── init.js (runs on startup)
     │   ├── schema.sql
     │   └── participium.db (from volume)
     └── ... (other server files)
   
   Frontend Container:
   /usr/share/nginx/html/
     ├── index.html
     ├── assets/
     │   └── ... (JS, CSS from Vite build)
     └── ... (static React app)

   DB Container:
   /app/server/db/
     └── participium.db (volume mount, shared with backend)


┌──────────────────────────────────────────────────────────────────────┐
│                        TECHNOLOGY STACK                              │
└──────────────────────────────────────────────────────────────────────┘

Frontend:
  • React 18
  • Vite (build tool)
  • Nginx (web server)
  • Bootstrap, Leaflet, React Router

Backend:
  • Node.js 20
  • Express.js 5
  • SQLite3 (database)
  • Passport.js (authentication)
  • Swagger (API documentation)

Infrastructure:
  • Docker & Docker Compose
  • Nginx (reverse proxy)
  • Docker Volumes (persistent storage)

