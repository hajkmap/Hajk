# GeoServer Proxy

The main purpose for this proxy is to proxy requests to a local installed GeoServer, adding a header with the user's name.
Through this proxy users may access secured layers in GeoServer depending on AD-group membership.

If you change the Proxy Base URL setting in GeoServer you will also be able to use these layers from QGIS and other GIS clients.

## Setup

This proxy may be installed in a folder in Hajk or as a seperate application in IIS:

- Publish the application using Build -> Publish Proxy in Visual Studio 2019
- Create a folder on your server
- Copy the published files to the folder
- Convert the folder to an application in IIS or add a new site
- Update Web.config and change the settings localhostServer, removeDomainNameFromUser and headerAttributeName:
  -- localhostServer: URL to GeoServer application
  -- removeDomainNameFromUser: Use 1 to remove the domain name from the user name, 0 to keep the domain name
  -- headerAttributeName: Name of attribute to add to the request. Use the same name as in GeoServer

## Usage

https://server-dns/[proxy-folder]/geoserver[/optional?QueryString]

### Example:
The proxy is installed at https://kommungis.varberg.se in folder util.
In Web.config localhostServer is set to http://localhost:8080/geoserver/ and headerAttributeName is set to 'X-Control-Header'

This request is sent from the client:
https://kommungis.varberg.se/util/geoserver/wms?SERVICE=WMS&VERSION=1.1.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=ext_lm_v1:fastighet_yta_alla_vw&SRS=EPSG%3A3007&TILED=true&WIDTH=256&HEIGHT=256&STYLES=&BBOX=150000%2C6322168%2C157168%2C6329336

The request will get proxied to:
http://localhost:8080/geoserver/wms?SERVICE=WMS&VERSION=1.1.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=ext_lm_v1:fastighet_yta_alla_vw&SRS=EPSG%3A3007&TILED=true&WIDTH=256&HEIGHT=256&STYLES=&BBOX=150000%2C6322168%2C157168%2C6329336

A header with the name 'X-Control-Header' will get added to the request

