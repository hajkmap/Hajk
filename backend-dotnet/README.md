# Hajk-backend .NET 

## Abstract 

Hajk is an open source web GIS solution based on the latest technologies such as React, Material UI and OpenLayers. This .NET backend is one of two possible backends to use with Hajk, the other being the node.js backend.

It is important that those who setup a Hajk-based solution have a clear understanding of the following.

Hajk consists of three technically separate applications that work together to provide a full-fledged experience to both users and administrators:

Client (the web map front end)
Admin (a frontend for Client's configuration files)
Backend (.NET or node.js)

## Quick start 

The easiest way to set up this .NET backend is to use IIS on Windows. Follow this step by step guide.

1. Make sure that IIS is installed.
2. Review the [Backend settings](#Settings).
3. [Publish .NET backend](#Publish).
4. [Set up IIS](#IIS).
5. [Run backend](#Run).
6. Run Hajk the [Client](#Client) and [Admin](#Admin).

### Technical requirements 

- .NET Framework 6

### Installation dependencies 

- JsonPath .NET (https://www.newtonsoft.com/json/help/html/Introduction.htm)
- Serilog AspNetCore (https://github.com/serilog/serilog-aspnetcore)
- Swashbuckle AspNetCore (https://learn.microsoft.com/en-us/aspnet/core/tutorials/web-api-help-pages-using-swagger?view=aspnetcore-6.0)

### <a name="Settings"></a> Backend settings

There are several settings for this backend, described below.

#### Logging

There are several different logging methods. A description of how to log a file is given below. For more information and other logging methods, visit https://serilog.net/.

##### Log level

The log level set log information.

```json
"Serilog": {
   "Using": [],
   "MinimumLevel": {
   "Default": "Information",
   "Override": {
      "Microsoft": "Warning",
      "System": "Warning"
   }
   },
   "WriteTo": [
   {
      "Name": "File",
      "Args": {
         "path": "Logs\\log.txt"
      }
   }
   ]
}
```

##### Write to file

The path can either be an absolute or a relative path.

```json
"WriteTo": [
{
   "Name": "File",
   "Args": {
      "path": "Logs\\log.txt"
   }
}
]
```

#### Paths to data

All data paths are configurable and can be given as an absolute or a relative path.

##### DataContent

The path to the root folder.

```json
"DataContent": {
   "Path": "App_Data"
}
```

##### Documents

The path to all documents for the informative plugin.

```json
"Documents": {
   "Path": "App_Data\\documents"
}
```

##### Media

Three paths for the image, video and audio files for the informative plugin.
_Please note that this example the same path is used for all three media resources._

```json
"Media": {
   "Audio": {
      "Path": "App_Data\\upload",
      "AllowedExtensions": [ "mp3", "wav", "ogg" ]
   },
   "Image": {
      "Path": "App_Data\\upload",
      "AllowedExtensions": [ "jpg", "jpeg", "png" ]
   },
   "Video": {
      "Path": "App_Data\\upload",
      "AllowedExtensions": [ "mp4", "mov", "ogg" ]
   }
}
```

The allowed extensions can be set individually for each media resource.
_Please note that this example the ogg extension can be both an audio or a video file._

```json
"Media": {
   "Audio": {
      "Path": "App_Data\\upload",
      "AllowedExtensions": [ "mp3", "wav", "ogg" ]
   },
   "Image": {
      "Path": "App_Data\\upload",
      "AllowedExtensions": [ "jpg", "jpeg", "png" ]
   },
   "Video": {
      "Path": "App_Data\\upload",
      "AllowedExtensions": [ "mp4", "mov", "ogg" ]
   }
}
```

##### OpenAPISpecification

The path and filename to the Open API specification of this backend.

```json
"OpenAPISpecification": {
   "Path": "OpenAPISpecification",
   "File": "api.yml"
}
```

##### Templates

The path and filename to the map file template. This template is used when a new map file is created.

```json
"Templates": {
   "Path": "App_Data\\templates",
   "Name": "map.template"
}
```

#### Proxy

##### FMEProxy

The FME Proxy endpoint will proxy the specified query to FME server REST API.

```json
"FmeProxy": {
   "FmeServerBaseUrl": "https://fmeserver.some.domain.com",
   "FmeServerUser": "someFmeUser",
   "FmeServerPassword": "aGreatFmeUserPassword"
}
```

To be able to use the FME Proxy the "FmeProxy" appsettings must be set, where "FmeServerBaseUrl" is the URL to the FME server instance, "FmeServerUser" is an FME server user and "FmeServerPassword" the password for the supplied user.

##### FB Proxy

The FB Proxy endpoint will proxy the specified query to Sokigo's FB API.

```json
"FbProxy": {
   "FbServiceBaseUrl": "https://fbserver.some.domain.com",
   "FbServiceDatabase": "aDatabase",
   "FbServiceUser": "someFbUser",
   "FbServicePassword": "aGreatFbUserPassword"
}
```

To be able to use the FB Proxy the "FbProxy" appsettings must be set, where "FbServiceBaseUrl" is the URL to the FB service, "FbServiceDatabase" the name of the FB database, "FbServiceUser" is an FB user and "FbServicePassword" the password for the supplied user.

#### Active Directory

The backend has support for Active Directory, to activate the support fo Active Directory the parameters under ActiveDirectory must be set.

```json
"ActiveDirectory": {
   "Active": true,
   "IdentifyUserWithWindowsAuthenticationX": true,
   "Groups": ["ADGroupsAllowedAccess"],
   "Url": "ldap://",
   "BaseDN": "OU=xxx,DC=xxx,DC=xx",
   "UserName": "ADUserName",
   "Password": "ADPassword"
}
```

##### Active

This property indicates whether the Active Directory configuration is currently active or not.

##### IdentifyUserWithWindowsAuthenticationX

This property indicates whether users should be identified using Windows authentication.

##### Groups

This property contains an array of Active Directory groups that are allowed to access AD supported endpoints.

##### Url

This property contains the URL of the LDAP server.

##### BaseDN

This property contains the distinguished name (DN) of the Active Directory domain or organizational unit (OU) that will be used as the base for searches.

##### UserName

This property contains the username of the Active Directory user that will be used to connect to the LDAP server

##### Password

This property contains the username of the Active Directory user that will be used to connect to the LDAP server

## Deploy

To deploy this backend follow the [Publish .NET backend](#Publish), [Set up IIS](#IIS) and [Run backend](#Run) headings sequentially.

### <a name="Publish"></a> Publish .NET backend

The backend needs first to be "deployed" before it can be set up in IIS. Follow this step by step guide only need to be done once.

1. Start Visual Studio and open the backend-dotnet solution file (backend-dotnet.sln).
2. Right-click on the solution (MapService) and the left-click on Publish.
3. Click on the "New" with a plus sign.
4. Choose "Web Server (IIS)" and click "Next".
5. Choose "Web Deploy Package".
   5.1 Choose a Package location (where all files will be saved).
   5.2 Choose a Site name, e.g. "mapservice".
   5.3 Press "Finish".

### <a name="IIS"></a> Set up IIS

The easiest way to set up the .NET backend is to use IIS on Windows. Follow this step by step guide.

1. Copy the deployed files from step above [Publish .NET backend](#Publish) if they are in the wrong folder.
2. Start IIS.
3. Right click on "Sites" and click "Add Website...".
   3.1 Give the site a name in IIS, e.g. "mapservice".
   3.2 Point out the path to the deployed folder.
   3.2 Give a port number on which the web service will run, it is recommended to use port 3002.
4. Make sure that the service is running.

### <a name="Run"></a> Run backend

The easiest way to set up the .NET backend is to use IIS on Windows. Follow this step by step guide.

1. Either click "Browse" in the "Actions" section on the far right or enter the service URL manually, don't forget to add "/swagger" to the end of the URL in either case.

### View OpenAPI specification

Browse to the web service and add "/swagger" to the end of the URL.

### <a name="Client"></a> Client

Now when Backend is up and running, it's time to start the Client (and optionally Admin) applications.

1. You must tell the Client app the location of a running Backend. The configuration is made by editing new-client/public/appConfig.json. Make sure that mapserviceBase is a valid URL to a running instance of the Backend (if you're using the NodeJS application and your Backend is running on port 3002, you should set mapserviceBase to "http://localhost:3002".
2. The client application resides inside new-client. Go there (cd new-client) and install the dependencies and start by typing: npm i && npm start.
3. Verify that Client is running on http://localhost:3000.

### <a name="Admin"></a> Admin

This optional process is similar to the Client app.

1. Set the correct URL to Backend by editing new-admin/public/config.json.
   Map operations have moved to mapconfig so "url_map", "url_map_list", "url_map_create", "url_map_delete" needs to point toward "http://localhost:3002/mapconfig...", the rest is the same as for new-client
2. The admin application is located in new-admin. To get it running do cd new-admin && npm i && npm start.
3. Verify that Admin is running on http://localhost:3001.

## Developer information

For developer information, see [CONTRIBUTING.md](https://github.com/hajkmap/Hajk/blob/master/CONTRIBUTING.md).
