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
2. Review the [Backend settings](#backend-settings).
3. [Publish .NET backend](#publish-net-backend).
4. [Set up IIS](#Set-up-IIS).
5. [Run backend](#Run-backend).
6. Run Hajk the [Client](#Client) and [Admin](#Admin).

### Technical requirements 

- .NET Framework 6

### Installation dependencies 

- JsonPath .NET (https://www.newtonsoft.com/json/help/html/Introduction.htm)
- Serilog AspNetCore (https://github.com/serilog/serilog-aspnetcore)
- Swashbuckle AspNetCore (https://learn.microsoft.com/en-us/aspnet/core/tutorials/web-api-help-pages-using-swagger?view=aspnetcore-6.0)

## <a id="backend-settings"></a>Backend settings

There are several settings for this backend, described below.

All data paths are configurable and can be given as an absolute or a relative path.

### Logging

There are several different logging methods. A description of how to log a file is given below. For more information and other logging methods, visit https://serilog.net/.

#### Log level

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

#### Write to file

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

### Allowed Hosts

Specifies the allowed hosts for the application. Use "\*" to allow all hosts or provide a comma-separated list of allowed hosts.

```json
"AllowedHosts": "*"
```

### Environment

The `Environment` configuration setting allows you to specify whether you are setting up the application in a development or production environment. The value can be set to "Development" or "Production".

When the `Environment` is set to "Development", Cross-Origin Resource Sharing (CORS) will be disabled. This means that the application will allow requests from any host, without any restrictions.

On the other hand, when the `Environment` is set to "Production", CORS will be enabled. This imposes stricter security measures and enforces the same-origin policy, meaning that the application will only allow requests from the same domain.

It's important to configure the `Environment` setting correctly to ensure proper behavior and security for your application.

```json
"Environment": "Development"
```

### DataContent

The path to the root folder.

```json
"DataContent": {
   "Path": "App_Data"
}
```

### Templates

The path and filename to the map file template. This template is used when a new map file is created.

```json
"Templates": {
   "Path": "App_Data\\templates",
   "Name": "map.template"
}
```

### Informative

```json
"Informative": {
   "Documents": {
      "Path": "App_Data\\documents"
   },
   "Audio": {
      "Path": "App_Data\\upload",
      "Extensions": [ "mp3", "wav", "ogg" ]
   },
   "Image": {
      "Path": "App_Data\\upload",
      "Extensions": [ "jpg", "jpeg", "png" ]
   },
   "Video": {
      "Path": "App_Data\\upload",
      "Extensions": [ "mp4", "mov", "ogg" ]
   }
}
```

The paths and allowed extensions can be set individually for each media resource.
_Please note that this example the ogg extension can be both an audio or a video file._

#### Documents

##### Path

The path to all documents for the informative plugin.

#### Audio

##### Path

The path for audio files for the informative plugin.

##### Extensions

The supported extensions for audio files for the informative plugin.

#### Image

##### Path

The path for image files for the informative plugin.

##### Extensions

The supported extensions for image files for the informative plugin.

#### Video

##### Path

The path for video files for the informative plugin.

##### Extensions

The supported extensions for video files for the informative plugin.

### Active Directory

The backend has support for Active Directory, to activate the support fo Active Directory the parameters under ActiveDirectory must be set.

LDAP servers can have different configurations that determine whether they treat certain components of the connection as case-sensitive or case-insensitive. For example, some LDAP servers may treat the server name as case-insensitive, while others may require an exact case match.

It's important to consult the documentation or specifications of the specific LDAP server you are working with to determine the case-sensitivity rules it follows for various components of the connection.

```json
"ActiveDirectory": {
   "LookupActive": true,
   "IdentifyUserWithWindowsAuthentication": true,
   "ExposeUserObject": true,
   "AdminGroups": ["ADGroupsAllowedAccess"],
   "TrustedProxyIPs": [ "::1" ],
   "TrustedHeader": "X-Control-Header",
   "Url": "ldap://",
   "BaseDN": "OU=xxx,DC=xxx,DC=xx",
   "UsernameKey": "userprincipalname",
   "Username": "ADUserName",
   "Password": "ADPassword"
}
```

#### LookupActive

This property specifies whether the Active Directory configuration is currently active or not.

#### IdentifyUserWithWindowsAuthentication

This property specifies whether users should be identified using Windows authentication through IIS (Internet Information Services).

To enable this functionality, follow these steps:

1. Set up the backend in IIS.
2. Disable Anonymous Authentication in IIS.
3. Enable Windows Authentication in IIS.

Enabling Windows authentication will automatically provide the authenticated user to the trusted "X-Control-Header" header.

#### ExposeUserObject

This property specifies whether user information from the Active Directory will be included in the result obtained from the `config\{map}` endpoint.

#### AdminGroups

This property contains an array of Active Directory groups that are allowed to access AD supported endpoints.

#### TrustedProxyIPs

This property is a comma-separated list of IP addresses that we trust, e.g. [ "10.0.1.1", "10.0.1.2" ]. These IP addresses represent the proxies through which requests pass, and we consider them safe and reliable.

To include the localhost as a trusted proxy, make sure to add ::1 to the list of trusted IP addresses. This is necessary when your application is running locally and you want to trust requests originating from the localhost.

#### TrustedHeader

This property specifies the name of the HTTP header that will contain the trusted user name. By default, the value is set to `X-Control-Header`. This default header name is commonly used in the OpenAPI specification of the backend.

It's important to note that changing the value of TrustedHeader does not impact the OpenAPI specification. The specification will continue to use `X-Control-Header` regardless of any changes made to TrustedHeader.

#### Url

This property specifies the URL of the LDAP server.

#### BaseDN

This property specifies the distinguished name (DN) of the Active Directory domain or organizational unit (OU) that will be used as the base for searches.

#### UsernameKey

This property specifies the key in the Active Directory against which the supplied username will be validated.

Ensure that you set the UsernameKey property to the correct attribute in the Active Directory that corresponds to the username. This allows the authentication system to properly validate the username against the provided value.

For example, if the username in the Active Directory is stored in the sAMAccountName attribute, you would configure the `UsernameKey` as sAMAccountName.

#### Username

This property specifies the username of the Active Directory user that will be used to connect to the LDAP server

#### Password

This property specifies the password of the Active Directory user that will be used to connect to the LDAP server

### FMEProxy

The FME Proxy endpoint will proxy the specified query to FME server REST API.

```json
"FmeProxy": {
   "FmeServerBaseUrl": "https://fmeserver.some.domain.com",
   "FmeServerUser": "someFmeUser",
   "FmeServerPassword": "aGreatFmeUserPassword"
}
```

To be able to use the FME Proxy the "FmeProxy" appsettings must be set, where "FmeServerBaseUrl" is the URL to the FME server instance, "FmeServerUser" is an FME server user and "FmeServerPassword" the password for the supplied user.

### FB Proxy

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

### OpenAPISpecification

The path and filename to the Open API specification of this backend.

```json
"OpenAPISpecification": {
   "Path": "OpenAPISpecification",
   "File": "api.v2.yml"
}
```

## Deploy

To deploy this backend follow the [Publish .NET backend](#publish-net-backend), [Set up IIS](#Set-up-IIS) and [Run backend](#Run-backend) headings sequentially.

### <a id="#publish-net-backend"></a>Publish .NET backend

Before the backend can be used, it must first be "deployed". Follow this step by step guide only need to be done once.

1. Start Visual Studio and open the backend-dotnet solution file (backend-dotnet.sln).
2. Right-click on the solution (MapService) and the left-click on Publish.
3. Click on the "New" with a plus sign.
4. Choose "Web Server (IIS)" and click "Next".
5. Choose "Web Deploy Package".
   5.1 Choose a Package location (where all files will be saved).
   5.2 Choose a Site name, e.g. "mapservice".
   5.3 Press "Finish".

### <a id="Set-up-IIS"></a>Set up IIS

The easiest way to set up the .NET backend is to use IIS on Windows. Follow this step by step guide.

1. Copy the deployed files from step above [Publish .NET backend](#publish-net-backend) if they are in the wrong folder.
2. Start IIS.
3. Right click on "Sites" and click "Add Website...".
   3.1 Give the site a name in IIS, e.g. "mapservice".
   3.2 Point out the path to the deployed folder.
   3.2 Give a port number on which the web service will run, it is recommended to use port 3002.
4. Make sure that the service is running.
5. To utilize Windows Authentication via IIS, it is necessary to disable Anonymous Authentication and enable Windows Authentication within the Authentication settings of the website.

### <a id="Run-backend"></a>Run backend

The easiest way to set up the .NET backend is to use IIS on Windows. Follow this step by step guide.

1. Either click "Browse" in the "Actions" section on the far right or enter the service URL manually, don't forget to add "/swagger" to the end of the URL in either case.

### View OpenAPI specification

Browse to the web service and add "/swagger" to the end of the URL.

### <a id="Client"></a>Client

Now when Backend is up and running, it's time to start the Client (and optionally Admin) applications.

1. You must tell the Client app the location of a running Backend. The configuration is made by editing apps/client/public/appConfig.json. Make sure that mapserviceBase is a valid URL to a running instance of the Backend (if you're using the NodeJS application and your Backend is running on port 3002, you should set mapserviceBase to "http://localhost:3002".
2. The client application resides inside apps/client. Go there (cd apps/client) and install the dependencies and start by typing: npm i && npm start.
3. Verify that Client is running on http://localhost:3000.

### <a id="Admin"></a>Admin

This optional process is similar to the Client app.

1. Set the correct URL to Backend by editing apps/admin/public/config.json.
   Map operations have moved to mapconfig so "url_map", "url_map_list", "url_map_create", "url_map_delete" needs to point toward "http://localhost:3002/mapconfig...", the rest is the same as for client
2. The admin application is located in apps/admin. To get it running do cd apps/admin && npm i && npm start.
3. Verify that Admin is running on http://localhost:3001.

## Developer information

For developer information, see [CONTRIBUTING.md](https://github.com/hajkmap/Hajk/blob/master/CONTRIBUTING.md).
