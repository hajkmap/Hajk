# Hajk and Docker

## Official images

The easiest way to run Hajk in Docker is to use the official images, published on the GitHub Container Registry:

| Image                         | Contains                                                      | Port   | Built from                               |
| ----------------------------- | ------------------------------------------------------------- | ------ | ---------------------------------------- |
| `ghcr.io/hajkmap/hajk`        | Backend, Client and Admin, run with Node.js                   | `3002` | [`Dockerfile`](../Dockerfile)            |
| `ghcr.io/hajkmap/hajk-simple` | Client only, as static files served by nginx, with no Backend | `8080` | [`Dockerfile.simple`](Dockerfile.simple) |

Both are built for `linux/amd64` and `linux/arm64`. Which tag to use, how the images are updated and the nightly builds are described in [Releases](../docs/releases.md#docker-images).

### Keeping the base image up to date

A release tag such as `4.3` only changes when a Hajk patch release comes out. Between releases, the Node.js and operating system packages in the image do not get updates, so a vulnerability scanner will find more in it over time. To pick up those updates, choose one of the following:

- **Use the nightly build of your minor version**, such as `nightly-4.3`. It is the latest patch release of 4.3, rebuilt every night on the current upstream base image. Nightly builds are made for the two latest minor versions only, and the tag of an older version is removed. Pull it regularly, for example with a scheduled job or a tool such as Watchtower, and recreate the container.
- **Rebuild the image yourself** from the release tag, with `docker build --pull --no-cache`, as described in [Building the images yourself](#building-the-images-yourself).

npm dependencies are installed from Hajk's lockfiles in either case, so they only change with a Hajk release. Who is responsible for what in the images is described in [SECURITY.md](../SECURITY.md#official-docker-images).

### Hajk

```bash
docker volume create hajk-appdata
docker run -d --name hajk -p 3002:3002 -v hajk-appdata:/usr/app/App_Data ghcr.io/hajkmap/hajk:4.3
```

Hajk is now available on <http://localhost:3002>, and Admin on <http://localhost:3002/admin>.

- **Configuration** is read from `/usr/app/.env` in the container, which contains the defaults from [`apps/backend/.env.example`](../apps/backend/.env.example). Mount your own `.env` there, or set the settings as environment variables.
- **Maps, layers and other data** are stored in `/usr/app/App_Data`. Mount a volume there, as above, so they survive when the container is replaced.

> [!WARNING]
> With the default settings, anyone who can reach the container can use Admin and change the maps. Read [How do we harden our installation?](../docs/security-faq.md#how-do-we-harden-our-installation) before you expose Hajk to anyone else.

### Hajk simple

```bash
docker run -d --name hajk-simple -p 8080:8080 ghcr.io/hajkmap/hajk-simple:4.3
```

Hajk is now available on <http://localhost:8080>. Without a Backend, the Client reads its maps and layers from `simpleMapAndLayersConfig.json`. To use your own configuration, mount your files over the defaults in `/usr/share/nginx/html`:

```bash
docker run -d --name hajk-simple -p 8080:8080 \
  -v "$PWD/appConfig.json:/usr/share/nginx/html/appConfig.json:ro" \
  -v "$PWD/simpleMapAndLayersConfig.json:/usr/share/nginx/html/simpleMapAndLayersConfig.json:ro" \
  ghcr.io/hajkmap/hajk-simple:4.3
```

nginx runs as a non-root user. Its configuration is in [`nginx-simple.conf`](nginx-simple.conf).

## Building the images yourself

Build from the root of the repository:

```bash
# Hajk
docker build --tag hajk .

# Hajk simple
docker build --file Docker/Dockerfile.simple --tag hajk-simple .
```

### Red Hat UBI

[`Dockerfile.ubi9-nodejs`](Dockerfile.ubi9-nodejs) builds Hajk (Backend, Client and Admin) on Red Hat's [Universal Base Image](https://catalog.redhat.com/software/base-images) 9 with Node.js, for organisations that need to run Red Hat based images. It is not published as an image. It copies your `apps/backend/.env` into the image, so create that file from `.env.example` first:

```bash
cp apps/backend/.env.example apps/backend/.env
docker build --file Docker/Dockerfile.ubi9-nodejs --tag hajk-ubi9 .
```

## Examples

> [!CAUTION]
> **The files in [`examples/`](examples) are examples, not for production.** They show ways to build and run Hajk, but are not maintained or tested like the official images, may be out of date, and leave out things a production setup needs, such as TLS, secrets management, resource limits and backups. Use them as a starting point, and review them before using anything from them.

| Example                                                                 | What it shows                                                                                   |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [`compose/`](examples/compose)                                          | Hajk with PostGIS and GeoServer behind nginx, with login through Keycloak, using Docker Compose |
| [`backend-and-admin.dockerfile`](examples/backend-and-admin.dockerfile) | Backend and Admin only, for developing the Client outside Docker                                |

### Docker Compose

The [compose example](examples/compose) is a complete setup: Hajk, PostGIS and GeoServer behind nginx, where users log in once, with Keycloak, and both Hajk and GeoServer get their user name and groups. See its [README](examples/compose/README.md).

### Backend and Admin only

Runs the Backend and Admin in Docker while you develop the Client on your computer:

```bash
docker build --file Docker/examples/backend-and-admin.dockerfile --tag hajk-backend-and-admin .
docker run -d -p 3002:3002 -v hajk-appdata:/usr/app/App_Data hajk-backend-and-admin
```

Set `mapserviceBase` to `http://localhost:3002/api/v2` in `apps/client/public/appConfig.json`.

## Ports

The port a container listens on is not always the port you open in the browser. In `-p 8080:3002`, Hajk listens on `3002` inside the container, and you open <http://localhost:8080>. Hajk logs the port inside the container, so it prints `3002` either way.
