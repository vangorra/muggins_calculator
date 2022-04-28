#!/usr/bin/env bash
set -euf -o pipefail
#
# Script that manages the development environment docker interactions.
#

SELF_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
ENV_PASS_THROUGH="BASE_HREF CI GITHUB_TOKEN"
DOCKERFILE_PATH="$SELF_DIR/Dockerfile"
DOCKERFILE_MD5_PATH="$SELF_DIR/.Dockerfile.md5"
IMAGE_LABEL="muggins_build_environment"
CONTAINER_NAME="$IMAGE_LABEL"
DOCKER_ARGS=""
for ENV_VAR in $ENV_PASS_THROUGH
do
  ENV_VAL=$(env | grep "$ENV_VAR=" | cut -d '=' -f2 || true)
  if [[ -n "$ENV_VAL" ]]; then
    DOCKER_ARGS="$DOCKER_ARGS --env $ENV_VAR=$ENV_VAL"
  fi
done

if [[ -z "${CI:-}" ]]; then
  DOCKER_ARGS="--tty $DOCKER_ARGS"
fi

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

function isImageExists() {
  docker images "$IMAGE_LABEL" --format "{{.Repository}}" | wc --lines || echo "0"
}

function maybeBuild() {
  NEW_MD5=$(cat "$DOCKERFILE_PATH" | md5sum - | grep --only-matching --extended-regexp "[a-z0-9]+");
  CURRENT_MD5=$(test -e "$DOCKERFILE_MD5_PATH" && cat "$DOCKERFILE_MD5_PATH" || echo "");
  IMAGE_EXISTS=$(isImageExists);
  if [[ "$IMAGE_EXISTS" = "0" ]] || [[ "$NEW_MD5" != "$CURRENT_MD5" ]]; then
    build;
    updateDockerfileMd5;
  fi
}

function start() {
    echo "";
    echo "Starting container '$CONTAINER_NAME'.";
    stopRaw &> /dev/null;
    docker create \
      --interactive \
      $DOCKER_ARGS \
      --name "$CONTAINER_NAME" \
      --volume "$SELF_DIR:/workspace" \
      --publish "4200:4200" \
      "$IMAGE_LABEL"; &> /dev/null
    docker start "$CONTAINER_NAME" &> /dev/null
}

function isRunning() {
  docker ps --filter name="$CONTAINER_NAME" --format "{{.Names}}" | wc --lines || echo "0"
}

function maybeStart() {
  IS_RUNNING=$(isRunning)
  if [[ "$IS_RUNNING" = "0" ]]; then
    start;
  fi
}

function exec() {
  echo ""
  echo "Running command '$@'."
  docker exec --interactive $DOCKER_ARGS "$CONTAINER_NAME" $@;
}

function status() {
  CONTAINER_STATUS=$(test $(isRunning) = "1" && echo "Running" || echo "Not running");
  IMAGE_STATUS=$(test $(isImageExists) = "1" && echo "Exists" || echo "Does not exist");
  echo "Container"
  echo "  Status: $CONTAINER_STATUS"
  echo "    Name: $CONTAINER_NAME"
  echo "Image"
  echo "  Status: $IMAGE_STATUS"
  echo "    Name: $IMAGE_LABEL"
}

function showHelp() {
  echo "Usage ./devenv.sh <command>";
  echo "  clean          - Remove existing container and images.";
  echo "  build          - Build the image if needed.";
  echo "  exec [command] - Execute a command inside the container. *";
  echo "    Example: ./devenv.sh exec gulp serve"
  echo "  help|-h|--help - Show this help text."
  echo "  start          - Start the container. *";
  echo "  status         - Show the status of the container."
  echo "  stop           - Stop the currently running container.";
  echo ""
  echo "  * Will build and start a container if needed."
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
elif [[ "$COMMAND" = "status" ]]; then
  status;
  exit;
elif [[ "$COMMAND" = "stop" ]]; then
  stop;
  exit;
else
  echo "Error: Unknown command '$COMMAND'."
  showHelp
  exit 1
fi
