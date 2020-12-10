# hajk-backend

Hajk backend

## Quick start

1. Review settings in .env
2. Install dependencies

```shell
# install deps
npm install
```

3. Run

```shell
# run in development mode with auto-reload on file changes
npm run dev

# or debug it, to enable debugging in e.g. VS Code

npm run dev:debug
```

## Deploy

First compile the application:

```shell
npm run compile
```

This will create a new folder, `/dist`.

You can now start the app in production mode (`npm start`). But it's preferable to move the contents of `/dist` to some other location, outside of the development branch. Do something like:

```shell
# Copy the compiled files
cp dist/* /opt/wwwroot/hajk

# Bring the settings from .env
cp .env /opt/wwwroot/hajk

# Bring info on NPM modules too
cp package*.json /opt/wwwroot/hajk

# Get there…
cd /opt/wwwroot/hajk

# Install modules
npm i

# Ready to run
node index.js
```

### Run as a service

Optionally, install PM2 to ensure that the app is run as a service (auto-started on server reboots, etc).

### Serve client and admin from Node too

Optionally, you can make this Node process serve the static client and admin apps as well.

To do that, move the previously compiled (`build` folders) from `client` and `admin` into `/opt/wwwroot/hajk/public`. Or, even better, move `admin` into a directory in `/public`, but let contents of `client/build` be the root of `public`. In this scenario, you can access Hajk's client app on localhost:3002, the API will be running on localhost:3002/api/v1, and `admin` will be available on localhost:3002/admin. Make sure to edit `client/appConfig.json` and `admin/config.json` to talk to the API on correct endpoint.
