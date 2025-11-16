#!/bin/bash

# Start script for Participium Docker containers

cd "$(dirname "$0")/.."

echo "🐳 Starting Participium containers..."
docker compose -f docker/docker-compose.yml up --build -d

echo ""
echo "✅ Containers started!"
echo ""
echo "📍 Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:3001"
echo "   API Docs: http://localhost:3001/api-docs"
echo ""
echo "📋 View logs: docker compose -f docker/docker-compose.yml logs -f"
echo "🛑 Stop containers: docker compose -f docker/docker-compose.yml down"

