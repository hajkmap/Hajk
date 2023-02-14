# Hajk-backend .net 

## Abstract 

Hajk is an open source web GIS solution based on the latest technologies such as React, Material UI and OpenLayers. This .net backend is one of two possible backends to use with Hajk, the other being the node.js backend.

It is important that those who setup a Hajk-based solution have a clear understanding of the following.

Hajk consists of three technically separate applications that work together to provide a full-fledged experience to both users and administrators:

Client (the web map front end)
Admin (a frontend for Client's configuration files)
Backend (.net or node.js)

## Quick start 

The easiest way to set up the .net backend is to use IIS on Windows. Follow this step by step guide.

1. Make sure that IIS is installed.
2. Add a new website.
   2.1 Publish a new .net backend, see the [Publish .net backend](#Publish) heading below.
   2.2 Set the physical path to the published files.
   2.3 It is recommended to use port 3002, which is the default port for hajk.

### Technical requirements 

- .NET Framework 6

### Installation dependencies 

- JsonPath .Net (https://www.newtonsoft.com/json/help/html/Introduction.htm)
- Serilog AspNetCore (https://github.com/serilog/serilog-aspnetcore)
- Swashbuckle AspNetCore (https://learn.microsoft.com/en-us/aspnet/core/tutorials/web-api-help-pages-using-swagger?view=aspnetcore-6.0)

### Backend settings

There are several settings for this backend. All these settings are described below.

#### Logging

There are several ways that logging can be done. Only a description of how to log a file is given. For more information visit https://serilog.net/.

##### Log level

The log level set log information.
"Serilog": {
&nbsp;&nbsp; "Using": [],
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"MinimumLevel": {
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**"Default": "Information",**
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"Override": {
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"Microsoft": "Warning",
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"System": "Warning"
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}
&nbsp;&nbsp;&nbsp;&nbsp;},
&nbsp;&nbsp;"WriteTo": [
&nbsp;&nbsp;&nbsp;&nbsp;{
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"Name": "File",
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"Args": {
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"path": "Logs\\log.txt"
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}
&nbsp;&nbsp;&nbsp;&nbsp;}
&nbsp;&nbsp;]
},

##### Write to file

The path settings are in bold.The path can either be an absolute or a relative path.
"Serilog": {
&nbsp;&nbsp; "Using": [],
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"MinimumLevel": {
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"Default": "Information",
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"Override": {
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"Microsoft": "Warning",
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"System": "Warning"
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}
&nbsp;&nbsp;&nbsp;&nbsp;},
&nbsp;&nbsp;"WriteTo": [
&nbsp;&nbsp;&nbsp;&nbsp;{
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"Name": "File",
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"Args": {
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**"path": "Logs\\log.txt"**
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}
&nbsp;&nbsp;&nbsp;&nbsp;}
&nbsp;&nbsp;]
},

#### Paths to data

All data paths are configurable and can be given as an absolute or a relative path.

##### DataContent

The path to the root directory.

"DataContent": {
&nbsp;&nbsp;**"Path": "App_Data"**
},

##### Documents

The path to all documents for the informative plugin.

"Documents": {
&nbsp;&nbsp;**"Path": "App_Data\\documents"**
},

##### Media

Three paths for the image, video and audio files for the informative plugin.
_Please note that this example the same path is used for all three media resources._

"Media": {
&nbsp;&nbsp;"Audio": {
&nbsp;&nbsp;&nbsp;&nbsp;**"Path": "App_Data\\upload",**
&nbsp;&nbsp;&nbsp;&nbsp;"AllowedExtensions": [ "mp3", "wav", "ogg" ]
&nbsp;&nbsp;},
&nbsp;&nbsp;"Image": {
&nbsp;&nbsp;&nbsp;&nbsp;**"Path": "App_Data\\upload",**
&nbsp;&nbsp;&nbsp;&nbsp;"AllowedExtensions": [ "jpg", "jpeg", "png" ]
&nbsp;&nbsp;},
&nbsp;&nbsp;"Video": {
&nbsp;&nbsp;&nbsp;&nbsp;**"Path": "App_Data\\upload",**
&nbsp;&nbsp;&nbsp;&nbsp;"AllowedExtensions": [ "mp4", "mov", "ogg" ]
&nbsp;&nbsp;}
},

The allowed extensions can be set individually for each media resource.
_Please note that this example the ogg extension is can be both an audio and a video file._

"Media": {
&nbsp;&nbsp;"Audio": {
&nbsp;&nbsp;&nbsp;&nbsp;"Path": "App_Data\\upload",
&nbsp;&nbsp;&nbsp;&nbsp;**"AllowedExtensions": [ "mp3", "wav", "ogg" ]**
&nbsp;&nbsp;},
&nbsp;&nbsp;"Image": {
&nbsp;&nbsp;&nbsp;&nbsp;"Path": "App_Data\\upload",
&nbsp;&nbsp;&nbsp;&nbsp;**"AllowedExtensions": [ "jpg", "jpeg", "png" ]**
&nbsp;&nbsp;},
&nbsp;&nbsp;"Video": {
&nbsp;&nbsp;&nbsp;&nbsp;"Path": "App_Data\\upload",
&nbsp;&nbsp;&nbsp;&nbsp;**"AllowedExtensions": [ "mp4", "mov", "ogg" ]**
&nbsp;&nbsp;}
},

##### OpenAPISpecification

The path to the Open API specification of this backend.

##### Templates

The path to the map file template. This template is used when a new map file is created.

#### Proxy

##### FMEProxy

The FME Proxy endpoint will proxy the specified query to FME server REST API.
To be able to use the FME Proxy the "FmeProxy" appsettings must be set, where "FmeServerBaseUrl" is the url to the FME server instance, "FmeServerUser" is an FME server user and "FmeServerPassword" the password for the supplied user.

##### FB Proxy

The FB Proxy endpoint will proxy the specified query to Sokigo's FB API.
To be able to use the FB Proxy the "FbProxy" appsettings must be set, where "FbServiceBaseUrl" is the url to the FB service, "FbServiceDatabase" the name of the FB database, "FbServiceUser" is an FB user and "FbServicePassword" the password for the supplied user.

#### AD 

### Client settings

### Admin settings

## Deploy

### <a name="Publish"></a> Publish .net backend

### Set up IIS

### Set up AD

### Run backend

### View OpenAPI specification

## Step by step guide for development

1.
2.
3.

## Source code in GIT
