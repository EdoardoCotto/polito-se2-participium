#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: docker/publish-dockerhub.sh --tag <tag> [--repo <name>] [--latest]

Builds all Participium images (db, backend, frontend) and pushes them
to a single Docker Hub repository. Each component is tagged as
<repo>:<component>-<tag> (e.g. polito-se2-participium:backend-v1).

Make sure you run `docker login` before using this script.

Options:
  --tag <tag>      Required version tag (e.g. demo-2-release-1)
  --repo <name>    Docker Hub repo (default: neginmotaharifar/polito-se2-participium)
  --latest         Also push component-specific latest tags (<component>-latest)
  -h, --help       Show this help message
EOF
}

TAG=""
REPO="neginmotaharifar/polito-se2-participium"
PUSH_LATEST=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag)
      TAG="${2:-}"
      shift 2
      ;;
    --repo)
      REPO="${2:-}"
      shift 2
      ;;
    --latest)
      PUSH_LATEST=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$TAG" ]]; then
  echo "Error: --tag is required" >&2
  usage
  exit 1
fi

if [[ -z "$REPO" ]]; then
  echo "Error: --repo value cannot be empty" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

declare -A DOCKERFILES=(
  ["db"]="${REPO_ROOT}/docker/Dockerfile.db"
  ["backend"]="${REPO_ROOT}/docker/Dockerfile.backend"
  ["frontend"]="${REPO_ROOT}/docker/Dockerfile.frontend"
)

for component in db backend frontend; do
  dockerfile_path="${DOCKERFILES[$component]}"

  if [[ ! -f "$dockerfile_path" ]]; then
    echo "Skipping ${component}: Dockerfile not found at ${dockerfile_path}" >&2
    continue
  fi

  component_version_tag="${component}-${TAG}"
  image="${REPO}:${component_version_tag}"

  echo "➡️  Building ${component} image (${image})..."
  docker build -f "$dockerfile_path" -t "$image" "$REPO_ROOT"

  echo "⬆️  Pushing ${image}..."
  docker push "$image"

  if [[ "$PUSH_LATEST" == true ]]; then
    latest_tag="${REPO}:${component}-latest"
    echo "🔁 Tagging ${image} as ${latest_tag}..."
    docker tag "$image" "$latest_tag"

    echo "⬆️  Pushing ${latest_tag}..."
    docker push "$latest_tag"
  fi

  echo "✅ ${component} image published"
done

echo "🎉 All components built and pushed to ${REPO}."
