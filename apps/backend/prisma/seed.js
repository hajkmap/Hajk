import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const DEFAULT_PROJECTION_CODE = "EPSG:3006";

const jsonToPrisma = new Map();
const prismaToJson = new Map();

const generateRandomName = () => {
  const adjectives = [
    "hidden",
    "ancient",
    "vast",
    "mysterious",
    "uncharted",
    "remote",
    "scenic",
    "explored",
    "rugged",
    "legendary",
    "charted",
    "fabled",
    "enigmatic",
    "wild",
    "endless",
  ];

  const nouns = [
    "path",
    "trail",
    "route",
    "compass",
    "ridge",
    "valley",
    "summit",
    "waypoint",
    "island",
    "horizon",
    "landmark",
    "canyon",
    "terrain",
    "district",
    "region",
    "atlas",
    "globe",
    "map",
    "boundary",
    "zone",
  ];

  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${
    nouns[Math.floor(Math.random() * nouns.length)]
  }-${(Math.floor(Math.random() * 9999) + 1).toString().padStart(4, "0")}`;
};

function replaceNullWithUndefined(arr) {
  return arr.map((layer) => {
    return Object.fromEntries(
      Object.entries(layer).map(([key, value]) => [
        key,
        value === null ? undefined : value,
      ])
    );
  });
}

async function getAvailableMaps() {
  try {
    const dir = path.join(process.cwd(), "App_Data");
    // List dir contents, the second parameter will ensure we get Dirent objects
    const dirContents = await fs.promises.readdir(dir, {
      withFileTypes: true,
    });
    const availableMaps = dirContents
      .filter(
        (entry) =>
          // Filter out only files (we're not interested in directories).
          entry.isFile() &&
          // Filter out the special case, layers.json file.
          entry.name !== "layers.json" &&
          // Only JSON files
          entry.name.endsWith(".json")
      )
      // Create an array using name of each Dirent object, remove file extension
      .map((entry) => entry.name.replace(".json", ""));
    return availableMaps;
  } catch (error) {
    return { error };
  }
}

async function readMapConfigAndPopulateMap(file) {
  console.log(`START MAP CONFIG "${file}"`);

  // Start by reading the existing JSON config
  const pathToFile = path.join(process.cwd(), "App_Data", `${file}.json`);
  const text = await fs.promises.readFile(pathToFile, "utf-8");
  const mapConfig = await JSON.parse(text);

  // First take care of projections. Each map will have a bunch of them.
  // Before we can connect the current map's projections to our
  // collection of Projections, we must ensure that we've populated
  // the Projection model.
  // We do want to skip duplicates as each projection code should be unique.
  console.log("Creating projections…");
  const proj = await prisma.projection.createMany({
    data: mapConfig.projections,
    skipDuplicates: true,
  });
  console.log(`Created ${proj.count} new projections`);

  // Now when all projections used by this current map exist in the
  // Projection model, we can prepare an object that will connect
  // the used projections with those in our model.
  const projectionsToConnect = mapConfig.projections.map((p) => {
    return { code: p.code };
  });
  console.log(
    `Connected ${projectionsToConnect.length} projections to map ${file}`
  );

  // Take care of tools. Right now we let each map have it's own Tool.
  console.log("Creating tools…");
  const toolsToConnectToMap = [];
  for await (const t of mapConfig.tools) {
    const tool = await prisma.tool.create({
      data: { type: t.type, options: t.options },
    });

    // Add potential role restrictions on the tool
    await updateRolesFromVisibleForGroups(
      t.options.visibleForGroups || [],
      tool.id,
      "tool"
    );

    // While inserting each of the tools, we prepare an object
    // that will be used later, to connect the recently-inserted tool
    // with the map that it belongs to.
    toolsToConnectToMap.push({
      toolId: tool.id,
      mapName: file,
      index: t.index,
      options: t.options,
    });
  }

  // Finally we can create the map
  console.log("Creating map…");
  const createdMap = await prisma.map.create({
    data: {
      name: file, // We use the file name as our unique map identifier
      options: mapConfig.map, // Put all map options as-is, as JSON
      projections: {
        connect: projectionsToConnect,
      },
      // I can't figure out how to connect 'tools' and 'layers' at
      // this stage. It doesn't work as for 'projections'. The main
      // difference is that 'projections' is an implicit m-n relation,
      // while the other are explicit. But we take care of it in the
      // next step, where we write some data into the relation tables
      // directly.
    },
  });

  // Now that the map is created, we can create and connect roles that should have access to the map.
  // The "roles" (defined as groups in the .json-files) are set on the layerSwitcher...
  const visibleForGroups =
    mapConfig.tools.find((t) => t.type === "layerswitcher").options
      ?.visibleForGroups || [];

  // Add potential role restrictions on the map
  await updateRolesFromVisibleForGroups(visibleForGroups, createdMap.id, "map");

  // Once the map is created, we can connect it with its tools
  const connectedTools = await prisma.toolsOnMaps.createMany({
    data: toolsToConnectToMap,
  });
  console.log(`Connected ${connectedTools.count} tools to map ${file}`);

  console.log(`END MAP CONFIG "${file}"\n\n`);
}

const extractServiceTypeFromKey = (key) => {
  switch (key) {
    case "wmtslayers":
      return "WMTS";
    case "wmslayers":
      return "WMS";
    case "wfslayers":
      return "WFS";
    case "vectorlayers":
      return "VECTOR";
    case "wfstlayers":
      return "WFST";
    case "arcgislayers":
      return "ARCGIS";
  }
};

async function readAndPopulateLayers() {
  try {
    const pathToFile = path.join(process.cwd(), "App_Data", `layers.json`);
    const text = await fs.promises.readFile(pathToFile, "utf-8");
    const layersCollection = await JSON.parse(text);

    const servicesCollection = [];

    for (const [key, layers] of Object.entries(layersCollection)) {
      // Prisma behaves better (uses default values) if the supplied value is undefined instead of null.. Let's do some cleanup.
      const cleanedLayers = replaceNullWithUndefined(layers);

      const type = extractServiceTypeFromKey(key);

      // Extract unique `url` values from the layers
      const services = [
        ...cleanedLayers.map((layer) => {
          return {
            type,
            serverType:
              layer.serverType === "qgis" ? "QGIS_SERVER" : "GEOSERVER",
            url: layer.url,
            version: layer.version || undefined,
            projection: layer.projection || DEFAULT_PROJECTION_CODE,
            owner: layer.owner || layer.infoOwner,
            name: generateRandomName(),
          };
        }),
      ];

      // Modify services array, keep only those objects that have
      // a unique url property.
      const uniqueServices = [
        ...new Map(services.map((item) => [item.url, item])).values(),
      ];

      servicesCollection.push(...uniqueServices);
    }

    for (const { owner, projection, ...service } of servicesCollection) {
      await prisma.service.create({
        data: {
          ...service,
          metadata: { create: { owner: owner, created: new Date() } },
          projection: {
            connect: { code: projection || DEFAULT_PROJECTION_CODE },
          },
        },
      });
    }

    const servicesInDB = await prisma.service.findMany();
    console.log(`Created ${servicesInDB.length} services`);

    // Loop through each layer and create them in the database
    for (const [key, layers] of Object.entries(layersCollection)) {
      // Prisma behaves better (uses default values) if the supplied value is undefined instead of null.. Let's do some cleanup.
      const cleanedLayers = replaceNullWithUndefined(layers);

      // Look out for duplicates!
      const dupes = cleanedLayers
        .map((e) => e.id)
        .filter((e, i, a) => a.indexOf(e) !== i);
      // Abort if found (we can't continue because we
      // enforce a unique constraint on the IDs in Layer model)
      if (dupes.length !== 0) {
        throw new Error(
          `Found duplicate layer id(s): ${dupes.toString()}. Please remove the duplicate entry/ies from your layers.json and retry.`
        );
      }

      // We'll need the layer's type, to select the correct service from the database
      const type = extractServiceTypeFromKey(key);

      // Loop through layers, but do it asynchronously as we'll
      // need to await for each layer's service to be inserted into the database

      for (const layer of cleanedLayers) {
        const service = await prisma.service.findFirst({
          where: { url: layer.url, type },
        });

        const options = {
          useCustomDpiList: layer.useCustomDpiList,
          customDpiList: layer.customDpiList,
        };

        const createdLayer = await prisma.layer.create({
          data: {
            name: layer.caption,
            internalName: !layer.internalLayerName
              ? generateRandomName()
              : layer.internalLayerName,
            legendUrl: layer.legend,
            legendIconUrl: layer.legendIcon,
            opacity: layer.opacity,
            minZoom: layer.minZoom,
            maxZoom: layer.maxZoom,
            minMaxZoomAlertOnToggleOnly: layer.minMaxZoomAlertOnToggleOnly,
            customRatio: layer.customRatio,
            timeSliderVisible: layer.timeSliderVisible,
            timeSliderStart: layer.timeSliderStart,
            timeSliderEnd: layer.timeSliderEnd,
            singleTile: layer.singleTile,
            tiled: layer.tiled,
            hidpi: layer.hidpi,
            service: { connect: { id: service.id } },
            metadata: {
              create: {
                title: layer.infoTitle,
                description: layer.infoText,
                url: layer.infoUrl,
                urlTitle: layer.infoUrlText,
                created: new Date(),
              },
            },
            infoClickSettings: {
              create: {
                format: layer.infoFormat,
                sortProperty: layer.infoClickSortProperty,
                sortMethod: layer.infoClickSortType,
                sortDescending: layer.infoClickSortDesc,
              },
            },
            searchSettings: {
              create: {
                active: Boolean(layer.searchUrl),
                url: layer.searchUrl,
                searchFields:
                  typeof layer.searchPropertyName === "string"
                    ? layer.searchPropertyName.split(",")
                    : layer.searchPropertyName || [],
                primaryDisplayFields:
                  typeof layer.searchDisplayName === "string"
                    ? layer.searchDisplayName.split(",")
                    : layer.searchDisplayName || [],
                secondaryDisplayFields:
                  typeof layer.secondaryLabelFields === "string"
                    ? layer.secondaryLabelFields.split(",")
                    : layer.secondaryLabelFields || [],
                shortDisplayFields:
                  typeof layer.searchShortDisplayName === "string"
                    ? layer.searchShortDisplayName.split(",")
                    : layer.searchShortDisplayName || [],
                outputFormat: layer.searchOutputFormat || undefined,
                geometryField: layer.searchGeometryField,
              },
            },
            options,
          },
        });

        // Store the mapping between layer ID and layer ID from DB to simplify seeding of layer groups etc.
        jsonToPrisma.set(layer.id, createdLayer.id);
        prismaToJson.set(createdLayer.id, layer.id);
      }

      const layersInDB = await prisma.layer.findMany({
        where: { service: { type } },
      });

      console.log(`Created ${layersInDB.length} ${type} layers`);

      // Add potential role restrictions on the layers
      for await (const layer of cleanedLayers) {
        await updateRolesFromVisibleForGroups(
          layer.visibleForGroups || [],
          jsonToPrisma.get(layer.id),
          "layer"
        );
      }
    }
  } catch (error) {
    console.error(error);
  }
}

// Populates the database with the layer structure for the map corresponding to mapName
async function populateMapLayerStructure(mapName) {
  const map = await prisma.map.findUnique({
    where: {
      name: mapName,
    },
    select: {
      id: true,
      tools: {
        where: {
          tool: {
            type: "layerswitcher",
          },
        },
      },
    },
  });
  const { baselayers, groups } = map.tools[0].options;

  // Imagine this is our "groups.json"…
  const groupsToInsert = [];

  // These arrays will hold the different relations between our entities
  const layersOnMaps = [];
  const layersOnGroups = [];
  const groupsOnMap = [];

  // Prepare background layers for insert by looping through everything
  // in "baselayers" in current map's LayerSwitcher's options. The goal
  // is to prepare an object that will be almost ready to use in Prisma's
  // createMany() method.
  baselayers.forEach((bl) => {
    const { id: layerId, ...rest } = bl;
    layersOnMaps.push({
      layerId: layerId,
      mapId: map.id,
      usage: "BACKGROUND",
      options: rest,
    });
  });

  // Helper: invoked recursively and extract any
  // layers and groups within the given group.
  const extractGroup = (group, parentId = null) => {
    // First let's handle the group's layers
    extractLayersFromGroup(group);

    // Next, let's handle the group itself
    const { id: groupId, name, toggled, expanded, visibleForGroups } = group;

    // This is a plain, flat group object - similar to layers.json
    groupsToInsert.push({
      id: groupId,
      name: name,
      visibleForGroups: visibleForGroups || [],
    });

    // Create a unique ID for this specific relation
    const newUUID = randomUUID();

    // This object will be used to describe this group's relations
    const groupsOnMapObject = {
      id: newUUID, // This specific group-map relations ID
      groupId, // Refers to ID in Group model
      parentGroupId: parentId,
      mapName,
      usage: "FOREGROUND",
      name,
      toggled,
      expanded,
    };

    groupsOnMap.push(groupsOnMapObject);

    // Finally, recursively call on any other groups that might be in this group
    group.groups?.forEach((g) => extractGroup(g, newUUID));
  };

  // Helper: called by extractGroup. Grabs all layers
  // in the given group.
  const extractLayersFromGroup = (group) => {
    const layerIds = [];
    group.layers.forEach((l) => {
      const { id: layerId, ...rest } = l;

      // Prepare object to insert into layersOnGroups
      layersOnGroups.push({
        layerId: layerId,
        groupId: group.id,
        usage: "FOREGROUND",
        options: rest,
      });

      layerIds.push(layerId);
    });

    // Return a list of ids that relate to a given group
    return layerIds;
  };

  // Next, go on with groups, recursively
  groups.forEach((g) => extractGroup(g));

  // Now we have all arrays ready. One more thing left is to
  // check for consistency: our map config may refer to layerIds
  // that did not exist in layers.json (hence they won't exist in
  // the Layer model now either). If we'd try to connect such a layer
  // to a map or group, we'd get a foreign key error. So let's wash the
  // layers so only valid entries remain.
  const layersInDB = await prisma.layer.findMany({
    select: { id: true },
  });

  const layerIdsInDB = layersInDB.map((l) => l.id);

  // Helper: used as a filter predicate to remove layers
  // that did not exist in database.
  const removeUnknownLayers = (l) => {
    return layerIdsInDB.indexOf(jsonToPrisma.get(l.layerId)) !== -1;
  };

  const validLayersOnMaps = layersOnMaps.filter(removeUnknownLayers);
  const validLayersOnGroups = layersOnGroups.filter(removeUnknownLayers);

  const validLayers = [...validLayersOnMaps, ...validLayersOnGroups];

  // Populates the Group model (the imaginative "groups.json")
  await prisma.group.createMany({
    data: groupsToInsert.map((g) => ({ id: g.id, name: g.name })),
    skipDuplicates: true, // We assume - for now! - that same ID means same group, so there's no need to watch out for conflicts
  });
  // Connect each of the inserted groups to map (and another group, where applicable)
  await prisma.groupsOnMaps.createMany({ data: groupsOnMap });
  // Connect valid layer instances (i.e. those layers that are used in maps (background) or groups (foreground))
  for await (const layer of validLayers) {
    const layerInstance = await prisma.layerInstance.create({
      data: {
        layerId: jsonToPrisma.get(layer.layerId),
        mapId: layer.mapId || undefined,
        groupId: layer.groupId || undefined,
        usage: layer.usage,
        options: layer.options,
      },
    });

    const visibleForGroups = layer.options.visibleForGroups || [];

    // Add potential role restrictions on the layer instances
    await updateRolesFromVisibleForGroups(
      visibleForGroups,
      layerInstance.id,
      "layerInstance"
    );
  }
  // Add potential role restrictions on the layer groups
  for await (const group of groupsToInsert) {
    await updateRolesFromVisibleForGroups(
      group.visibleForGroups || [],
      group.id,
      "group"
    );
  }
}

// Populates the database with the layer structure for all available maps currently in the database
async function populateLayerStructure() {
  const mapsFromDB = await prisma.map.findMany({ select: { name: true } });
  const maps = mapsFromDB.map((m) => m.name);
  const ro = [];
  for await (const map of maps) {
    const r = await populateMapLayerStructure(map);
    ro.push(r);
  }
  return { ro };
}

async function createBaseRoles() {
  const baseRoles = [
    {
      id: "0001",
      code: "SUPERUSER",
      title: "roles.superuserTitle",
      description: "roles.superuserDescription",
      systemCriticalRole: true,
    },
    {
      id: "0002",
      code: "ADMIN",
      title: "roles.adminTitle",
      description: "roles.adminDescription",
      systemCriticalRole: true,
    },
  ];

  for await (const role of baseRoles) {
    await prisma.role.create({
      data: {
        ...role,
      },
    });
  }
}

async function createLocalDummyAccounts() {
  const dummyUsers = [
    {
      email: "henrik@hallberg.se",
      fullName: "Henrik Hallberg",
      password: "Henrik",
    },
    {
      email: "jacob@wodzynski.se",
      fullName: "Jacob Wodzynski",
      password: "Jacob",
    },
    {
      email: "olof@svahn.se",
      fullName: "Olof Svahn",
      password: "Olof1",
    },
    {
      email: "albin@ahmetaj.se",
      fullName: "Albin Ahmetaj",
      password: "Albin",
    },
    {
      email: "jesper@adeborn.se",
      fullName: "Jesper Adeborn",
      password: "Jesper",
    },
    {
      email: "niklas@eriksson.se",
      fullName: "Niklas Eriksson",
      password: "Niklas",
    },
    {
      email: "elizabeth@barlow.se",
      fullName: "Elizabeth Barlow",
      password: "Elizabeth",
    },
    {
      email: "ingvar@petersson.se",
      fullName: "Ingvar Petersson",
      password: "Ingvar",
    },
    {
      email: "lars@samuelsson.se",
      fullName: "Lars Samuelsson",
      password: "Lars",
    },
  ];

  for await (const user of dummyUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.localAccount.create({
      data: {
        ...user,
        password: hashedPassword,
        user: {
          create: {
            email: user.email,
            fullName: user.fullName,
            strategy: "LOCAL",
            roles: {
              create: [
                {
                  role: {
                    connect: {
                      code: "SUPERUSER",
                    },
                  },
                },
              ],
            },
          },
        },
      },
    });
  }
}

async function updateRolesFromVisibleForGroups(
  visibleForGroups,
  entityId,
  entityType
) {
  for await (const group of visibleForGroups) {
    const role = await prisma.role.upsert({
      where: { code: group },
      update: {},
      create: { code: group, title: group, description: group },
    });

    switch (entityType) {
      case "map":
        await prisma.roleOnMap.create({
          data: {
            map: { connect: { id: entityId } },
            role: { connect: { id: role.id } },
          },
        });
        break;
      case "tool":
        await prisma.roleOnTool.create({
          data: {
            tool: { connect: { id: entityId } },
            role: { connect: { id: role.id } },
          },
        });
        break;
      case "layer":
        await prisma.roleOnLayer.create({
          data: {
            layer: { connect: { id: entityId } },
            role: { connect: { id: role.id } },
          },
        });
        break;
      case "layerInstance":
        await prisma.roleOnLayerInstance.create({
          data: {
            layerInstance: { connect: { id: entityId } },
            role: { connect: { id: role.id } },
          },
        });
        break;
      case "group":
        await prisma.roleOnGroup.create({
          data: {
            group: { connect: { id: entityId } },
            role: { connect: { id: role.id } },
          },
        });
        break;

      default:
        break;
    }
  }
}

async function main() {
  // Get all available map-config files...
  const mapConfigs = await getAvailableMaps();
  // ... and add the map configurations to the database.
  for (const mapConfig of mapConfigs) {
    await readMapConfigAndPopulateMap(mapConfig);
  }
  // Get all layers from layers.json and insert them into the layers table.
  await readAndPopulateLayers();
  // Finally we extract the layer switcher config from all maps and add all groups etc. with their connections to the database.
  // We're gonna want to keep crucial information such as the map layer structure separated from specific plugins such as the layer switcher.
  await populateLayerStructure();

  // Some base roles are required. For example, the role containing users that are allowed to use the admin endpoints etc.
  await createBaseRoles();

  await createLocalDummyAccounts();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
