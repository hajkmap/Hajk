# HAJK - Docker

## Standard image

The HAJK [standard Dockerfile](../Dockerfile) combines all of HAJK's parts (front-end, back-end using NodeJS and admin) into a single image that is very handy for testing or small scale deployments.

Image settings:
  * Exposed back-end port: tcp/1337
  * Exposed volume path for mounting of persistent back-end data: /usr/app/App_Data

### Sample Usage

Example build for back-end (NodeJS), admin and client image creation, running a container named `local-hajk-backend-with-client-and-admin` with local volume `hajk-backend-appdata` mounted for persistent data and exposing NodeJS on host port [tcp/1337](http://localhost:1337/).

```
# First time set-up of a local volume, this will make back-end data persistent
docker volume create hajk-backend-appdata

# Docker image build
docker build -t hajk-backend-with-client-and-admin:1.0.0 .

# For removing any previous container before re-configuration run:
# docker rm local-hajk-backend-with-client-and-admin

# Run container from local image
docker run -p 1337:3002 -v hajk-backend-appdata:/usr/app/App_Data --name local-hajk-backend-with-client-and-admin hajk-backend-with-client-and-admin:1.0.0
```

Note regarding ports for HAJK in a Docker setting: the port printed on e.g. HAJK's back-end console output is not neccesarily the host-exposed port. HAJK will locally in the container know of the right-hand side of the port expose command-line switch (`-p` for a Docker run), the host/your web-browser till need to use the left-hand side which is a port-forward rule into the container. In the example above, HAJK back-end will output:
```
[INFO] hajk - Server startup completed. Launched on port 3002. (http://localhost:3002)
```
Still, you would use [port 1337](http://localhost:1337/) for host access.

### Hosted Images

Courtesy of [Hallbergs](https://github.com/Hallbergs) there is also a [Docker Hub feed](https://hub.docker.com/r/hallbergs/hajk/tags) of the latest HAJK images. Use in a compose or local docker run command using the corresponding tag, e.g. `hallbergs/hajk:3.7.0` or `hallbergs/hajk:latest`.

## Compose

HAJK also contains a Docker Compose for a production-like set-up combining the following components into a hand "HAJK WebGIS in a box":

* [PostgreSQL](https://www.postgresql.org/) relational database with [PostGIS](https://postgis.net/) spatial extensions (based on the latest [Kartoza](https://www.kartoza.com/en/) image)
  * Exposes host port tcp/5432
* GeoSever map server (based on Kartoza v2.18.0 image) running as WAR in Tomcat Java application server
  * Exposes host port [tcp/8080](http://localhost:8080/)
* HAJK (based on the standard HAJK triple-combination, see above)
* nginx web server used as a unified proxy HTTP front (base on the latest nginx image)
  * Reverse-proxy of all `/proxy/*` URLs to HAJK proxy component
  * Reverse-proxy of all other URLs to the compose's local HAJK container
  * Exposes host port [tcp/1337](http://localhost:1337/)

### Development and Demo Usage

```
# cd hajk/Docker
docker-compose -p hajk up
```

Now use [GeoServer admin](http://localhost:8080/geoserver/) to set up a default workspace, a PostGIS datasource to host `db`, database `hajkGeoData` and you are good to go. Use exposed port 5432 to load data into PostgreSQL.

### Production Usage

For a production set-up you are free to re-use the compose file, but read up on [Docker Compose](https://docs.docker.com/compose/) syntax and make sure to do some adjustments like:

* change the composition's default passwords (use Docker secrets)
* set container memory limits
* adjust container re-start conditions to your needs
* pin all image versions to explicit releases for stability

Also consider running an orchestration component like Docker Stack/Swarm, Kubernetes, RedHat OpenShift or similar for greater scalibility flexibility in a high load production scenario.

## Alternative Dockerfiles

### Back-end + Admin
This directory contains alternative Dockerfile combinations for local development, testing etc.

* backend-and-admin.dockerfile - Alpine-based NodeJS builders combining HAJK back-end (NodeJS) and admin to finally combine the build into an Alpine NodeJS v14 image where the containern will start back-end's index.js
  * Image settings:
    * Exposed back-end port: tcp/3002
    * Exposed volume path for mounting of persistent back-end data: /usr/app/App_Data

#### Sample Usage

Example build for back-end (NodeJS) + admin image creation, running a container named `local-hajk-backend-and-admin` with local volume `hajk-backend-appdata` mounted for persistent data and exposing NodeJS on port [tcp/2000](http://localhost:2000/) on the host.

Corresponding appConfig setting for using this containerized back-end from host front-end development:
* `"mapserviceBase": "http://localhost:2000/api/v1",`

```
# cd hajk/Docker

# First time set-up of a local volume, this will make back-end data persistent
docker volume create hajk-backend-appdata

# Docker image build
docker build --file Docker/backend-and-admin.dockerfile -t hajk-backend-and-admin:0.1.0 .

# For removing any previous container before re-configuration run:
# docker rm local-hajk-backend-and-admin

# Run container from local image
docker run -p 2000:3002 -v hajk-backend-appdata:/usr/app/App_Data --name local-hajk-backend-and-admin hajk-backend-and-admin:0.1.0
```

## Room for future improvement

The current duplicated Dockerfile constructs into alternative Dockerfiles could be refined into e.g. a multi-stage build or other types of more clever parametrized build. Consider the current state of Docker "altfiles" a friendly stepping stone for developers using Docker for HAJK. And remember: this is open source, so please consider opening a pull request with your own improvements! Thanks.
