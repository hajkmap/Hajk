# Hajk with PostGIS, GeoServer and login

> [!CAUTION]
> **This is an example, not for production.** It runs on `http://localhost` without TLS, keeps Keycloak in development mode and leaves out secrets management, resource limits and backups. Use it as a starting point, and review it before using anything from it.

A complete Hajk setup in Docker Compose: Hajk, a [PostGIS](https://postgis.net/) database and a [GeoServer](https://geoserver.org/), behind an nginx reverse proxy that only lets in users who have logged in. Users log in once, with [Keycloak](https://www.keycloak.org/), and both Hajk and GeoServer get their user name and groups.

| Service          | Image                                                                                              | Does                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `nginx`          | [`nginx`](https://hub.docker.com/_/nginx)                                                          | The only way in. Asks oauth2-proxy who the user is.        |
| `oauth2-proxy`   | [`oauth2-proxy`](https://oauth2-proxy.github.io/oauth2-proxy/)                                     | Keeps the session cookie and runs the login with Keycloak. |
| `keycloak`       | [`keycloak`](https://www.keycloak.org/server/containers)                                           | Users and groups.                                          |
| `hajk`           | [`ghcr.io/hajkmap/hajk`](../../README.md#official-images)                                          | Hajk: Backend, Client and Admin.                           |
| `geoserver`      | [`docker.osgeo.org/geoserver`](https://docs.geoserver.org/latest/en/user/installation/docker.html) | Map services (WMS, WFS and more).                          |
| `geoserver-init` | [`curlimages/curl`](https://hub.docker.com/r/curlimages/curl)                                      | Runs once, to set up GeoServer's login. Then it exits.     |
| `db`             | [`postgis/postgis`](https://hub.docker.com/r/postgis/postgis)                                      | PostgreSQL with PostGIS, for your data.                    |

PostGIS and GeoServer are the images published by the PostGIS and GeoServer projects themselves.

## Start

```bash
cd Docker/examples/compose
cp example.env .env
```

Set every value in `.env`. Use long, random values; `example.env` shows how to create the two secrets. Then start everything:

```bash
docker compose up
```

The first start takes a few minutes, while the images are downloaded and Keycloak and GeoServer start. When `geoserver-init` has printed `GeoServer now reads users and roles from the headers set by nginx` and exited, everything is ready.

| What      | Where                                                                                |
| --------- | ------------------------------------------------------------------------------------ |
| Hajk      | <http://localhost:8080>, and Admin on <http://localhost:8080/admin>                  |
| GeoServer | <http://localhost:8080/geoserver>                                                    |
| Keycloak  | <http://localhost:8180>, log in as `admin` with `KEYCLOAK_ADMIN_PASSWORD`            |
| PostGIS   | `localhost:5433`, database `hajkGeoData`, user `postgres` with `POSTGRES_PASSWORD`   |
| Log out   | <http://localhost:8080/logout> logs out of Hajk and Keycloak, so you can switch user |

Log in as one of the example users, with `DEMO_USER_PASSWORD`:

| User    | Groups                  | In Hajk                 | In GeoServer      |
| ------- | ----------------------- | ----------------------- | ----------------- |
| `alice` | `GIS_ADMIN`, `GIS_USER` | the maps and Admin      | administrator     |
| `bob`   | `GIS_USER`              | the maps, but not Admin | can read services |

To start over from nothing, remove the containers and all data with `docker compose down --volumes`.

## How the login works

Neither Hajk nor GeoServer logs users in here. They trust the reverse proxy to do that, and to tell them who the user is in HTTP headers.

```text
browser ──> nginx ──> oauth2-proxy: is there a valid session cookie?
              │         no:  redirect the browser to Keycloak to log in
              │         yes: reply with the user's name, email and groups
              │
              ├──> Hajk       X-Control-Header        alice
              │               X-Control-Email-Header  alice@example.com
              │               X-Control-Group-Header  GIS_ADMIN,GIS_USER
              │
              └──> GeoServer  X-GeoServer-User        alice
               (/geoserver)   X-GeoServer-Roles       GIS_ADMIN;GIS_USER;ROLE_ADMINISTRATOR
```

1. [nginx](nginx/nginx.conf) asks [oauth2-proxy](https://oauth2-proxy.github.io/oauth2-proxy/) about every request, with `auth_request`.
2. Without a valid session cookie, oauth2-proxy sends the browser to Keycloak to log in, with OpenID Connect.
3. With one, oauth2-proxy replies with the user's name, email and groups, and nginx adds them to the request as headers. nginx always sets the headers, so any a browser sends itself are replaced.

### Hajk

Hajk reads the headers because `AD_LOOKUP_ACTIVE` and `AD_USE_GROUPS_FROM_HEADER` are `true` in [`compose.yaml`](compose.yaml). It believes them only when the request comes from nginx's IP address, `AD_TRUSTED_PROXY_IPS`. Otherwise, any container that can reach Hajk could claim to be any user.

Hajk compares the connecting address with that list exactly: it takes neither host names nor ranges. Docker hands out addresses as containers start, so nginx could get a new one each time. That is why [`compose.yaml`](compose.yaml) fixes the network to `172.28.0.0/24` and gives nginx `172.28.0.10`. The other containers get addresses from `172.28.0.128` and up (`ip_range`), so none of them can take nginx's. Hajk listens on IPv6 as well, so Node.js sees nginx as `::ffff:172.28.0.10`, and both forms are listed.

Hajk uses the groups to decide who can use Admin (`RESTRICT_ADMIN_ACCESS_TO_AD_GROUPS`), and which maps, layers and tools each user gets, as set in Admin.

### GeoServer

GeoServer reads the headers with an authentication filter called `hajk-header`, which [`geoserver/configure-security.sh`](geoserver/configure-security.sh) creates through GeoServer's REST API. It is first in the filter chains, so it is used for the web interface, the REST API and the OGC services. The filters that were there before stay after it, so the `admin` user can still log in with `GEOSERVER_ADMIN_PASSWORD`, for example to the REST API with basic authentication. You find the settings under _Security > Authentication_ in GeoServer.

GeoServer cannot check where a request comes from, like Hajk does. It must only be reachable through nginx, which is why it has no port of its own in `compose.yaml`.

**Groups and roles.** Hajk wants the groups separated by `,`, but GeoServer separates roles with `;`, and uses `,` between role parameters, as in `ROLE_A(p1=x,p2=y);ROLE_B`. Given Hajk's header, GeoServer would see `GIS_ADMIN,GIS_USER` as one single role. The separator is part of GeoServer's code and cannot be changed in its settings. So nginx sends GeoServer its own header, converted by [`nginx/geoserver-roles.js`](nginx/geoserver-roles.js) with nginx's JavaScript module (njs).

**Administrators.** GeoServer makes a user administrator if they have the role `ROLE_ADMINISTRATOR`. Roles from a header are not mapped to it, the way roles from GeoServer's own role service are, so `geoserver-roles.js` adds `ROLE_ADMINISTRATOR` for members of `GIS_ADMIN`. Change `GEOSERVER_ADMIN_GROUP` there to use another group.

**Restricting layers by group.** The groups can be used in GeoServer's data security rules, under _Security > Data_. For example, to let only `GIS_ADMIN` read the layers in the `topp` workspace, add the rule `topp.*.r` with the role `GIS_ADMIN`. Type the role name, as roles from a header are not listed. Then bob no longer sees those layers, neither in Hajk nor in GeoServer's capabilities.

## Using your data

In GeoServer, create a workspace and a PostGIS store with host `db`, port `5432`, database `hajkGeoData` and user `postgres`. Load data into PostGIS from your computer through `localhost:5433`, for example with QGIS or `ogr2ogr`.

PostGIS listens on `5432` inside Docker, where GeoServer reaches it, but on `5433` on your computer, so that it does not collide with a PostgreSQL you already run. To use another port, change `127.0.0.1:5433:5432` in `compose.yaml`. Then add the layers in Hajk's Admin, with `http://localhost:8080/geoserver/wms` as the URL.

PostGIS and Keycloak are only reachable from your own computer.

## Users and groups

The users, groups and the `hajk` client in Keycloak are imported from [`keycloak/hajk-realm.json`](keycloak/hajk-realm.json) when the Keycloak container is created. Keycloak runs in development mode, so changes you make in its admin console are lost when the container is recreated. To keep them, add them to the realm file. Values like `${DEMO_USER_PASSWORD}` in it are read from Keycloak's environment.

Keycloak sends the groups in the `groups` claim, by name and without the path (`GIS_ADMIN`, not `/GIS_ADMIN`). That is what Hajk and GeoServer get.

### Your own identity provider

Keycloak is here so that the example works on its own. oauth2-proxy can log users in with most OpenID Connect providers, such as Microsoft Entra ID, AD FS or Google:

1. Register Hajk in your provider, with the redirect URL `https://<your host>/oauth2/callback`.
2. Make sure the provider sends the user's groups in the `groups` claim. Entra ID, for example, sends group IDs unless it is set up to send names.
3. Remove `keycloak` from `compose.yaml`, and point the `OAUTH2_PROXY_*` settings at your provider. Usually `OAUTH2_PROXY_OIDC_ISSUER_URL` is enough, and the settings for skipping discovery can be removed.
4. Change the `/logout` address in `nginx/nginx.conf` to your provider's logout page.

nginx, Hajk and GeoServer do not change.

### Without a login service

If you already have a reverse proxy that logs users in, for example with Windows authentication, it only needs to set the same headers as nginx does here. Never let a request reach Hajk or GeoServer with headers that the proxy has not set itself.

## Files

| File                                                                 | What it is                                          |
| -------------------------------------------------------------------- | --------------------------------------------------- |
| [`compose.yaml`](compose.yaml)                                       | All services and their settings                     |
| [`example.env`](example.env)                                         | The passwords and secrets to set, copy it to `.env` |
| [`nginx/nginx.conf`](nginx/nginx.conf)                               | The reverse proxy and the login check               |
| [`nginx/geoserver-roles.js`](nginx/geoserver-roles.js)               | Converts the groups to GeoServer's format           |
| [`geoserver/configure-security.sh`](geoserver/configure-security.sh) | Sets up GeoServer's `hajk-header` filter            |
| [`keycloak/hajk-realm.json`](keycloak/hajk-realm.json)               | Keycloak's users, groups and the `hajk` client      |

## Good to know

- **Network.** The services share the network `172.28.0.0/24`. If Docker answers that the pool overlaps, or the network is already used on your computer or VPN, change the subnet, `ip_range` and nginx's address in `compose.yaml`, and also `AD_TRUSTED_PROXY_IPS`, `EXPRESS_TRUST_PROXY` and `GEOSERVER_TRUSTED_PROXIES`.
- **Ports.** On your computer, the example uses `8080` (nginx), `8180` (Keycloak) and `5433` (PostGIS). If one of them is taken, change the first number in `ports:` in `compose.yaml`. For `8080` and `8180`, also change the addresses with `localhost:8080` and `localhost:8180` in `compose.yaml`, `nginx/nginx.conf` and `keycloak/hajk-realm.json`, as they are part of the login.
- **Apple silicon and other ARM computers.** The PostGIS image is only built for amd64, so it runs emulated there, which works but is slower.
- **Recreating a service.** nginx looks the services up again every 10 seconds, so after a service is recreated, it may answer `502 Bad Gateway` for a few seconds.
- **The Hajk image.** `HAJK_TAG` in `.env` sets which tag of `ghcr.io/hajkmap/hajk` to use. See [Releases](../../../docs/releases.md#docker-images).
