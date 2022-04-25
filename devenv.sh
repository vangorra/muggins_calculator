#!/usr/bin/env bash
set -euf -o pipefail
#
# Script that manages the development environment docker interactions.
#

SELF_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
DOCKERFILE_PATH="$SELF_DIR/Dockerfile"
DOCKERFILE_MD5_PATH="$SELF_DIR/.Dockerfile.md5"
IMAGE_LABEL="muggins_build_environment"
CONTAINER_NAME="$IMAGE_LABEL"
COMMAND="$1"
shift

function stopRaw() {
  docker rm --force "$CONTAINER_NAME" &> /dev/null || true
}

function stop() {
  echo "";
  echo "Stopping container (forcing in 5 seconds)";
  stopRaw;
}

function clean() {
  echo "";
  echo "Removing image.";
  docker rmi "$IMAGE_LABEL" || true;
  echo "Removing container.";
  docker rm "$CONTAINER_NAME" || true;
}

function updateDockerfileMd5() {
  cat "$DOCKERFILE_PATH" | md5sum - | grep --only-matching --extended-regexp "[a-z0-9]+" > "$DOCKERFILE_MD5_PATH"
}

function build() {
  echo "";
  echo "Building image.";
  docker build --build-arg "RUNTIME_UID=${UID}" --file "$DOCKERFILE_PATH" --tag "$IMAGE_LABEL" "$SELF_DIR";
  updateDockerfileMd5;
}

function maybeBuild() {
  NEW_MD5=$(cat "$DOCKERFILE_PATH" | md5sum - | grep --only-matching --extended-regexp "[a-z0-9]+");
  CURRENT_MD5=$(test -e "$DOCKERFILE_MD5_PATH" && cat "$DOCKERFILE_MD5_PATH" || echo "");
  IMAGE_EXISTS=$(docker images "$IMAGE_LABEL" --format "{{.Repository}}" | wc --lines || echo "0");
  if [[ "$IMAGE_EXISTS" = "0" ]] || [[ "$NEW_MD5" != "$CURRENT_MD5" ]]; then
    build;
    updateDockerfileMd5;
  fi
}

function start() {
    echo "";
    echo "Starting container '$CONTAINER_NAME'.";
    stopRaw &> /dev/null;
    docker create --interactive --tty --name "$CONTAINER_NAME" --volume "$SELF_DIR:/workspace" --publish "4200:4200" "$IMAGE_LABEL"; &> /dev/null
    docker start "$CONTAINER_NAME" &> /dev/null
}

function maybeStart() {
  IS_RUNNING=$(docker ps --filter name="$CONTAINER_NAME" --format "{{.Names}}" | wc --lines || echo "0")
  if [[ "$IS_RUNNING" = "0" ]]; then
    start;
  fi
}

function exec() {
  echo ""
  echo "Running command '$@'."
  docker exec --interactive --tty "$CONTAINER_NAME" $@;
}

function showHelp() {
  echo "Usage ./devenv.sh <command>";
  echo "  clean          - Remove existing container and images.";
  echo "  build          - Build the image if needed.";
  echo "  exec [command] - Execute a command inside the container. *";
  echo "    Example: ./devenv.sh exec gulp serve"
  echo "  help|-h|--help - Show this help text."
  echo "  start          - Start the container. *";
  echo "  stop           - Stop the currently running container.";
  echo ""
  echo "  * Will build and start a container if needed."
  echo "Info:"
  echo "  Image Name: $IMAGE_LABEL"
  echo "  Container Name: $CONTAINER_NAME"
}

if [[ "$COMMAND" = "clean" ]]; then
  clean;
  exit;
elif [[ "$COMMAND" = "build" ]]; then
  build;
  exit;
elif [[ "$COMMAND" = "exec" ]]; then
  maybeBuild;
  maybeStart;
  exec $@;
elif [[ "$COMMAND" =~ ^(-h|--help|help)$ ]]; then
  showHelp;
  exit
elif [[ "$COMMAND" = "start" ]]; then
  maybeBuild;
  start;
  exit;
elif [[ "$COMMAND" = "stop" ]]; then
  stop;
  exit;
else
  echo "Error: Unknown command '$COMMAND'."
  showHelp
  exit 1
fi
