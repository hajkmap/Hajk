# Hajk 3

_An open source web GIS solution based on OpenLayers_

![alt text](https://user-images.githubusercontent.com/110222/96265856-42960000-0fc6-11eb-805e-9e41ec5d77f9.png "Hajk 3 with all tools visible")

**For developer info, see [CONTRIBUTING.md](https://github.com/hajkmap/Hajk/blob/master/CONTRIBUTING.md).**

**The old [Hajk 2 documentation](https://github.com/hajkmap/Hajk/blob/master/HAJK2_README.md) with detailed installation instructions (Swedish only) is now in a separate readme.**

## Quick start

_Note that Hajk consists of 3 applications: the main 'client' (which is the web map front end), 'admin' (which basically is a frontend for client's configuration files) and 'mapservice' (the backend server application which has a REST API)._

1. Clone the repository: `git clone https://github.com/hajkmap/Hajk.git`.
1. The client app is configured by editing `new-client/public/appConfig.json`. Make sure that `mapserviceBase` is a valid URL to a running instance of MapService that is reachable from your computer (see the following steps for how to deploy a working backend).
1. The client application resides inside `new-client`, so you can do: `cd new-client` and then `npm i && npm start`. (Note that if you have not yet configured a working backend in `appConfig.json`, you will get an error here – don't worry, we'll fix that soon.)
1. The admin application is located in `new-admin`. To get it running do `cd new-admin && npm i && npm start`.
1. The client and admin are accompanied by a backend (and an optional proxy) written in .NET. Open both projects in Visual Studio (in `mapservice` and `util` if you need a proxy), then Build and Publish.
1. Deploy to IIS, make sure that everything is running (choose "Browse" from IIS to see the mapservice page that lists available commands - if you see that, you're good to go). Make sure that the URL your mapservice is running on is the same as specified in client's `appConfig.json`.
1. Now you should have client running on localhost:3000 and admin on localhost:3001. Open a browser window and check them out!

To build admin or client, just do `npm run build` instead of `npm start`. This will create a subfolder (`build`) that you can rename and serve as static files from any web server.

If you plan to develop for Hajk, make sure to read the next section on code standard for the project.
