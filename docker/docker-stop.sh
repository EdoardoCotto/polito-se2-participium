#!/bin/bash

# Stop script for Participium Docker containers

cd "$(dirname "$0")/.."

echo "🛑 Stopping Participium containers..."
docker compose -f docker/docker-compose.yml down

echo "✅ Containers stopped!"

