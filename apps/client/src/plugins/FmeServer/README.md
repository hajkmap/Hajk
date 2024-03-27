# FME-Server Plugin

The main purpose for this plugin is to run FME-workspaces that are published to an FME server.
The plugin allows for both Data-download (targeting /fmeproxy/fmedatadownload/repository/workspace) as well as running with the REST-api (v3) (targeting /fmeproxy/fmerest/v3/transformations/submit/repository/workspace). Currently, the plugin is only available for users with the nodeJS backend, simply because the plugin relies on the fact that mapServiceBase/fmeProxy exists (and this is currently only implemented in the nodeJS backend).

## Developer info

The FmeServer-plugin is built as a functional component, and might seem a bit strange at first sight if you've only dealt with class components. However, remember that React is leaning toward more and more functional components, and in my opinion all new plugins should be built as functional components.
Functional components are really fun to build! I suggest you give it a go if you are planning on building/rewriting a plugin.

### TODO:s

As explained earlier, the plugin is only available for the users with the nodeJS backend. So, there are some TODO:s that i see as musts:

- Add /fmeProxy route to .NET backend. This route has a really simple job => Forward to FME-server with authentication.
- Make sure the .NET backend can handle the new tool in admin.

### Further development

Ideas for the future:

- Add possibility to extract all features from the draw-layer, so that these could be sent to FME-server

Feel free to add more!

## Setup

There are a few steps that an admin must complete before the plugin will function:

- Add a user to FME-server that can access and run workspaces in some repository.
- Enter details about the FME-server instance and the user created above in the .env-file (located in /new-backend).
- Enable the plugin in the admin-UI.
- Add a couple of products (workspaces) in the admin-ui.
- Make sure that everything works!

### The admin-UI

In the admin-UI, the administrators can add and remove products. Unfortunately, the admin-UI does not allow for editing of already added products. (Which means that the admin must remove the old product, then add it again with the new value if they want to change anything). There are a few settings on the products that might need some explanation:

- Name: The name of the product
- Group: Which group should the product belong to?
- Repository: In which repository is the workspace located?
- Workspace: Which workspace should the product target?
- geoAttribute: Which published parameter should we save the geometry to? (If no geometry is needed, set "none").
- maxArea: To avoid killing the FME-server instance, we allow for a max area for the drawn geometries (-1 can be used for no restrictions).
- infoUrl: If set, the plugin will display an IconButton pointing to the url supplied.
- availableForGroups: Set to comma-separated string of AD-groups if some products should only be visible for some users.

The admin-UI fetches information such as available repositories and workspaces (for the user specified in the .env-file) automatically to simplify the work for the administrators.

## Usage

The plugin is (should) be really simple to use. it is based on the idea of a stepper, where the user can move on only when they have completed the step they are on. The stepper should lead to a minimum of errors in the end, since we can force the user to make good choices.
