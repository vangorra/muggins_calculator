FROM mcr.microsoft.com/playwright:v1.21.0-focal

ARG RUNTIME_UID=1000
ENV PATH="$PATH:/workspace/node_modules/.bin/"

# If a user with the RUNTIME_UID already exists, use it. Otherwise, create the user.
RUN getent passwd "$RUNTIME_UID" > /dev/null \
    || useradd --home-dir /home/ubuntu --create-home --shell /bin/bash --gid root --groups sudo --uid "$RUNTIME_UID" ubuntu

# Use this UID for all operations inside the container.
USER "$RUNTIME_UID"

WORKDIR "/workspace"
EXPOSE 4200
VOLUME "/workspace"
