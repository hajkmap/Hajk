[![Netlify Status](https://api.netlify.com/api/v1/badges/fa0760e3-fd3a-43bf-a704-27e05cb901cc/deploy-status)](https://app.netlify.com/sites/hajk-demo/deploys)

# Hajk

_Hajk is an open source web GIS solution based on React, Material UI and OpenLayers. It is developed in Sweden and used by various municipalities and government agencies, as well as by public and private enterprises._

![Hajk 4 client UI example](https://github.com/user-attachments/assets/a221eb84-1b8c-440c-84ad-52b57f85b1d0)

## Want to contribute?

Please refer to [CONTRIBUTING.md](https://github.com/hajkmap/Hajk/blob/master/CONTRIBUTING.md).

## New to Hajk and not a developer?

If you are a new user of Hajk, please visit [our welcome page (Swedish only)](https://www.hajkmap.se/).

## Looking for support?

You can easily reach out to our community using the [Discussions on GitHub](https://github.com/hajkmap/Hajk/discussions).

## Live examples

The official, automatic build of the latest version can be found here: https://hajk-demo.netlify.app/.

For some real-life examples, see the following solutions:

- [Halmstad municipality's map](https://karta.halmstad.se)
- [Kungsbacka municipality's map](https://karta.kungsbacka.se)
- [The City of Gothenburg's map](https://karta.goteborg.se)
- [The Gothenburg Region's map](https://karta.goteborgsregionen.se)
- [Varberg municipality's map](https://karta.varberg.se)
- [Uddevalla municipality's map](https://karta.uddevalla.se)

## Community extensions

Community extensions are additions developed by the community outside the scope of the core Hajk distribution. These can include anything from rewrites in other programming languages to customized integrations with specific business systems.

For a list of community extensions, please refer to [this page](https://github.com/hajkmap/Hajk/blob/master/docs/community-extensions.md).

## Quick start (for admins)

Please refer to Hajk's official [installation guide](https://github.com/hajkmap/Hajk/wiki/Installation-guide-%28for-pre-packaged-releases%29).

## Quick start (for developers)

_Note that Hajk consists of 3 applications: Client UI (which is the web map front end), Admin UI (which basically is a frontend for Client UI's configuration files) and a Backend service (the server application that provides the REST API consumed by the two UI applications)._

### Clone the repo

Clone the repository: `git clone https://github.com/hajkmap/Hajk.git`.

### Get the Backend up and running

1. In `hajk` repo dir, go to `apps/backend` and install dependencies:

```sh
cd apps/backend
npm install
```

2. Review the settings in `.env`. It's fine to leave the defaults. Note which `PORT` is specified, by default it is `3002`.
3. Start the backend in development mode:

```sh
npm run dev
```

4. Verify that the server is up and running by navigating to `http://localhost:3002`. There's also a nice API explorer available on `http://localhost:3002/api-explorer/`.

#### Alternative approach: NodeJS backend in Docker

See Docker [README](Docker/README.md) for more information.

### Launch the Client app

Now when Backend is up and running, it's time to start the Client UI (and optionally Admin UI).

1. You must tell the Client app the location of the running Backend. The configuration is made by editing `apps/client/public/appConfig.json`. Make sure that `mapserviceBase` is a valid URL to a running instance of the Backend (if you're using the NodeJS application and your Backend is running on port 3002, you should set `mapserviceBase` to `"http://localhost:3002/api/v2"`.
1. The client application resides inside `apps/client`. Go there (`apps/client`) and install the dependencies and start by typing: `npm i && npm start`.
1. Verify that Client is running on `http://localhost:3000`.

### Launch the (optional) Admin app

This process is similar to the Client app.

1. Set the correct URL to Backend by editing `apps/admin/public/config.json`.  
   _Map operations have moved to mapconfig so `"url_map", "url_map_list", "url_map_create", "url_map_delete"` needs to point toward `"http://localhost:3002/api/v2/mapconfig..."`, the rest is the same as for `client/`_
2. The admin application is located in `apps/admin`. To get it running do `cd apps/admin && npm i && npm start`.
3. Verify that Admin is running on `http://localhost:3001`.

## Deploying

The provided NodeJS backend comes with a built-in, optional static files server that allows you to deploy the Client and Admin applications through the Hajk's backend application (hence leverage the optional Active Directory connection to restrict access to e.g. the Admin UI app). For details, see [this section in Backend's README](https://github.com/hajkmap/Hajk/tree/master/apps/backend#deploy).
