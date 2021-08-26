[![Docker Status](https://img.shields.io/docker/cloud/build/hallbergs/hajk)](https://hub.docker.com/r/hallbergs/hajk/)
[![Netlify Status](https://img.shields.io/netlify/fa0760e3-fd3a-43bf-a704-27e05cb901cc)](https://app.netlify.com/sites/hajk-demo/deploys)

# Hajk

_A full-fledged open source web GIS solution based on OpenLayers_

![alt text](https://user-images.githubusercontent.com/110222/96265856-42960000-0fc6-11eb-805e-9e41ec5d77f9.png "Hajk 3 with all tools visible")

**For developer info, see [CONTRIBUTING.md](https://github.com/hajkmap/Hajk/blob/master/CONTRIBUTING.md).**

## New to Hajk and not a developer?

If you are a new user of Hajk, please visit [our welcome page (Swedish only)](https://hajkmap.github.io/Hajk) for more information about Hajk.

## Live examples

The official automatic build of the latest version can be found here: https://hajk-demo.netlify.app/.

For some real-life examples, see the following solutions:

- [Halmstad municipality's map](https://karta.halmstad.se)
- [Kungsbacka municipality's map](https://karta.kungsbacka.se)
- [Göteborg stad](https://karta.goteborg.se)
- [The Gothenburg Region's map](https://karta.goteborgsregionen.se)
- [Varberg municipality's map](https://karta.varberg.se)
- [Uddevalla municipality's map](https://karta.uddevalla.se)

## Quick start (for admins)

Please refer to Hajk's official [installation guide](https://github.com/hajkmap/Hajk/wiki/Installation-guide-%28for-pre-packaged-releases%29).

## Quick start (for developers)

_Note that Hajk consists of 3 applications: the main 'client' (which is the web map front end), 'admin' (which basically is a frontend for client's configuration files) and 'mapservice' (the backend server application which has a REST API)._

### Clone the repo

Clone the repository: `git clone https://github.com/hajkmap/Hajk.git`.

### Get the Backend up and running

Note: There are currently two available backends for Hajk - you need to pick only one:

- NodeJS backend - a new, recently release backend. Rewritten from scratch in JS. Can be deployed on any platform supported by NodeJS.
- NET-backend - the original backend, requires Windows and IIS.

> If unsure on which backend to pick, it is **recommended to choose the NodeJS solution**. It is easier to setup because it only requires NodeJS (which you already have if you want to run Hajk anyway).

#### Alternative 1: NodeJS backend

1. In `hajk` repo dir, go to `new-backend` and install dependencies:

```
cd new-backend
npm install
```

2. Review the settings in `.env`. It's fine to leave the defaults. Note which `PORT` is specified, by default it is `3002`.
3. Start the backend in development mode:

```
npm run dev
```

4. Verify that the server is up and running by navigatig to `http://localhost:3002`. There's also a nice API explorer available on `http://localhost:3002/api-explorer/`.

#### Alternative 2: .NET backend

1. Make sure that you have Visual Studio and IIS installed.
1. Open the SLN-files in `backend/`
1. Build and publish.
1. Deploy to IIS. Make sure that everything is running (choose "Browse" from IIS to see the mapservice page that lists available commands - if you see that, you're good to go).

### Launch the Client app

Now when Backend is up and running, it's time to start the Client (and optionally Admin) applications.

1. You must tell the Client app the location of a running Backend. The configuration is made by editing `new-client/public/appConfig.json`. Make sure that `mapserviceBase` is a valid URL to a running instance of the Backend (if you're using the NodeJS application and your Backend is running on port 3002, you should set `mapserviceBase` to `"http://localhost:3002/api/v1"`.
1. The client application resides inside `new-client`. Go there (`cd new-client`) and install the dependencies and start by typing: `npm i && npm start`.
1. Verify that Client is running on `http://localhost:3000`.

### Launch the (optional) Admin app

This process is similar to the Client app.

1. Set the correct URL to Backend by editing `new-admin/public/config.json`.  
*Map operations have moved to mapconfig so `"url_map", "url_map_list", "url_map_create", "url_map_delete"` needs to point toward `"http://localhost:3002/api/v1/mapconfig..."`, the rest is the same as for `new-client`*
3. The admin application is located in `new-admin`. To get it running do `cd new-admin && npm i && npm start`.
4. Verify that Admin is running on `http://localhost:3001`.

## Deploying

You can use the NodeJS backend to deploy the Client and Admin applications as well. For details, see [this section in Backend's README](https://github.com/hajkmap/Hajk/tree/master/new-backend#deploy).

## Contributing

If you plan to develop for Hajk, make sure to read the next section on code standard for the project.
