# Docker and Jenkins deployment

The image runs the React production bundle and Node.js API together. Unit tests and the frontend build run in separate build stages. The runtime uses the non-root node user, listens on port 3000 inside the container, and exposes `/healthz` for readiness checks. The server still defaults to loopback outside Docker; the container sets HOST=0.0.0.0 so Docker can forward traffic.

## Run with Docker Compose

Prerequisites: Docker Engine or Docker Desktop with Linux containers, and Docker Compose v2 supporting `up --wait`.

1. Copy `.env.example` to `.env` and configure Google using GOOGLE_SETUP.md.
2. Set `APP_ORIGIN=http://127.0.0.1:3000` for the default local mapping. Use that exact origin in your browser. Google must have the corresponding `/api/auth/google/callback` redirect registered.
3. Run:

```sh
docker compose build
docker compose up -d --wait
docker compose ps
```

Open http://127.0.0.1:3000. If another local server already uses port 3000, stop it or set `BUGFLOW_HTTP_PORT=3001` and `APP_ORIGIN=http://127.0.0.1:3001` in `.env`, and update Google's redirect URI. Internal PORT remains 3000.

The default host binding is 127.0.0.1. For an approved network deployment, configure the external origin and reverse proxy explicitly. This application uses open registration into a shared workspace; do not expose private project data without invitation and project access controls. A hosted deployment also needs HTTPS and the matching Google callback.

Configuration and credentials are injected at runtime. `.dockerignore` excludes local databases, encryption keys and environment files from the build context. No real credentials are required for tests or image smoke checks. Without Google credentials, registration is available but verification mail waits for configuration.

## Persistent data

Compose mounts a named volume at `/data`. With the default project name, the volume is `bugflow_bugflow-data`; the actual prefix follows COMPOSE_PROJECT_NAME or the directory name. Use `docker compose -p bugflow` consistently if you want that exact name locally.

The SQLite database is `/data/bugflow.db`. The generated mail encryption key is persisted at `/data/.local/mail.key` through a link from `/app/.local`. If TOKEN_ENCRYPTION_KEY is configured instead, preserve that secret across every deployment. Changing or losing the key prevents decryption of stored Gmail tokens and queued mail.

`docker compose down` stops containers while preserving the named volume. Do not use `down --volumes` unless you intend to erase application data. Back up the stopped database and encryption key together before an upgrade. A new volume starts a new workspace with demonstration records; the image does not copy your existing local database. To migrate existing local data, stop both installations and restore both the database and the matching encryption key into the volume, owned by UID/GID 1000. Test on a backup first.

## Jenkins setup

1. Place this source in your Git repository, including Dockerfile, Jenkinsfile, compose.yaml, package-lock.json and tests. Do not commit `.env`, database files or `.local`.
2. Configure a trusted Linux Jenkins agent labelled `docker` with Docker CLI, Compose v2, daemon access and registry access to pull the Node base image and npm packages. A local daemon is recommended; remote daemons need explicit Docker context and credential arrangements.
3. Install Jenkins Pipeline, Git and Credentials Binding support. Create a Secret file credential named `bugflow-env` containing your deployment environment file. Include APP_ORIGIN and your Google credentials; optionally include TOKEN_ENCRYPTION_KEY, BUGFLOW_HTTP_PORT and BUGFLOW_BIND_IP. Do not set BUGFLOW_IMAGE or COMPOSE_PROJECT_NAME in this file; the pipeline sets those.
4. Create a Pipeline from SCM using `Jenkinsfile`. Use a trusted deployment branch; do not provide production credentials or Docker daemon access to untrusted pull-request jobs.
5. Run with DEPLOY unchecked to test and build only. Select DEPLOY to update the application on that agent's Docker host. No registry push is required because building and deploying use the same daemon.

Pipeline stages check Docker, run all tests in the test image stage, build a versioned runtime image, and start an isolated disposable container to check HTTP and database health. When deployment is selected, Compose loads the Jenkins credential, reuses the persistent named volume, and waits for healthy status. Test containers have no published ports, production data or real Google credentials.

The pipeline uses shell commands and therefore expects Linux agents. Windows Docker Desktop can run the manual Compose commands in PowerShell. Jenkins does not need Node installed directly; its builds run inside Docker. A Docker-enabled agent has powerful access to its host and should be dedicated to trusted builds.

## Failed deployment and rollback

This is a single-instance SQLite deployment with a brief restart, not a zero-downtime release. A failed health wait fails the pipeline; it does not automatically restore the old container. Images are retained with their Jenkins build numbers.

To roll back code on the same host, set `BUGFLOW_IMAGE=bugflow:<previous-build-number>` and run Compose with the same project name, runtime environment file and volume, using `up -d --no-build --wait`. Verify that older code is compatible with the current database schema first. Code rollback does not reverse database migrations; restore a verified database/key backup if required. Do not run multiple instances against the same SQLite volume or queue.

## Relevant references

- [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Node Docker image guidance](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Jenkins Declarative Pipeline](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Jenkins credential binding](https://www.jenkins.io/doc/pipeline/steps/credentials-binding/)
