import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const DEFAULT_PROJECTION_CODE = "EPSG:3006";

const jsonToDisplayLayerId = new Map();
const jsonToSearchLayerId = new Map();
const jsonToEditingLayerId = new Map();

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

const LAYER_KIND_BY_JSON_KEY = {
  wmslayers: "display",
  wmtslayers: "display",
  vectorlayers: "display",
  arcgislayers: "display",
  wfslayers: "search",
  wfstlayers: "editing",
};

function mapJsonLayerIdToPrisma(jsonLayerId, jsonKey) {
  const kind = LAYER_KIND_BY_JSON_KEY[jsonKey];
  if (kind === "search") return jsonToSearchLayerId.get(jsonLayerId);
  if (kind === "editing") return jsonToEditingLayerId.get(jsonLayerId);
  return jsonToDisplayLayerId.get(jsonLayerId);
}

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
      // enforce unique JSON ids within each bucket
      if (dupes.length !== 0) {
        throw new Error(
          `Found duplicate layer id(s): ${dupes.toString()}. Please remove the duplicate entry/ies from your layers.json and retry.`
        );
      }

      const type = extractServiceTypeFromKey(key);
      const layerKind = LAYER_KIND_BY_JSON_KEY[key];

      for (const layer of cleanedLayers) {
        const service = await prisma.service.findFirst({
          where: { url: layer.url, type },
        });

        const selectedLayers = Array.isArray(layer.layers)
          ? layer.layers
          : layer.layer
            ? [layer.layer]
            : [];

        if (layerKind === "search") {
          const createdLayer = await prisma.searchLayer.create({
            data: {
              name: layer.caption,
              internalName: layer.internalLayerName || generateRandomName(),
              selectedLayers,
              active: Boolean(
                layer.searchUrl ||
                (Array.isArray(layer.searchFields) &&
                  layer.searchFields.length > 0)
              ),
              url: layer.searchUrl,
              searchFields:
                layer.searchFields ||
                (typeof layer.searchPropertyName === "string"
                  ? layer.searchPropertyName.split(",")
                  : layer.searchPropertyName || []),
              primaryDisplayFields:
                layer.displayFields ||
                (typeof layer.searchDisplayName === "string"
                  ? layer.searchDisplayName.split(",")
                  : layer.searchDisplayName || []),
              secondaryDisplayFields:
                typeof layer.secondaryLabelFields === "string"
                  ? layer.secondaryLabelFields.split(",")
                  : layer.secondaryLabelFields || [],
              shortDisplayFields:
                typeof layer.searchShortDisplayName === "string"
                  ? layer.searchShortDisplayName.split(",")
                  : layer.searchShortDisplayName || [],
              outputFormat: layer.outputFormat || undefined,
              geometryField: layer.geometryField || layer.searchGeometryField,
              infobox: layer.infobox,
              aliasDict: layer.aliasDict,
              zIndex: layer.zIndex ?? 0,
              service: { connect: { id: service.id } },
              metadata: {
                create: {
                  title: layer.infoTitle,
                  description: layer.infoText,
                  url: layer.infoUrl,
                  urlTitle: layer.infoUrlText,
                  owner: layer.infoOwner,
                  created: new Date(),
                },
              },
              options: {},
            },
          });
          jsonToSearchLayerId.set(layer.id, createdLayer.id);
        } else if (layerKind === "editing") {
          const createdLayer = await prisma.editingLayer.create({
            data: {
              name: layer.caption,
              internalName: layer.internalLayerName || generateRandomName(),
              selectedLayers,
              geometryField: layer.geometryField || layer.searchGeometryField,
              service: { connect: { id: service.id } },
              options: {
                editPoint: layer.editPoint,
                editMultiPoint: layer.editMultiPoint,
                editLine: layer.editLine,
                editMultiLine: layer.editMultiLine,
                editPolygon: layer.editPolygon,
                editMultiPolygon: layer.editMultiPolygon,
                allowMultiGeometries: layer.allowMultipleGeometries,
                editableFields: layer.editableFields,
                nonEditableFields: layer.nonEditableFields,
              },
            },
          });
          jsonToEditingLayerId.set(layer.id, createdLayer.id);
        } else {
          const options = {
            useCustomDpiList: layer.useCustomDpiList,
            customDpiList: layer.customDpiList,
          };

          const createdLayer = await prisma.displayLayer.create({
            data: {
              name: layer.caption,
              internalName: layer.internalLayerName || generateRandomName(),
              selectedLayers,
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
              style: layer.style,
              hideExpandArrow: layer.hideExpandArrow,
              zIndex: layer.zIndex ?? 0,
              service: { connect: { id: service.id } },
              metadata: {
                create: {
                  title: layer.infoTitle,
                  description: layer.infoText,
                  url: layer.infoUrl,
                  urlTitle: layer.infoUrlText,
                  owner: layer.infoOwner,
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
              options,
            },
          });
          jsonToDisplayLayerId.set(layer.id, createdLayer.id);
        }
      }

      const countByKind = {
        display: await prisma.displayLayer.count({
          where: { service: { type } },
        }),
        search: await prisma.searchLayer.count({
          where: { service: { type } },
        }),
        editing: await prisma.editingLayer.count({
          where: { service: { type } },
        }),
      };

      console.log(
        `Created ${countByKind[layerKind] ?? 0} ${type} ${layerKind} layers`
      );

      for await (const layer of cleanedLayers) {
        const prismaId = mapJsonLayerIdToPrisma(layer.id, key);
        if (!prismaId) continue;
        await updateRolesFromVisibleForGroups(
          layer.visibleForGroups || [],
          prismaId,
          layerKind === "search"
            ? "searchLayer"
            : layerKind === "editing"
              ? "editingLayer"
              : "displayLayer"
        );
      }
    }
  } catch (error) {
    console.error(error);
  }
}

/** Map layer-switcher placement fields onto LayerInstance columns. */
function layerInstancePlacementFromOptions(options = {}) {
  const { drawOrder, visibleAtStart, ...rest } = options;
  return {
    zIndex: typeof drawOrder === "number" ? drawOrder : 0,
    visibleAtStart: Boolean(visibleAtStart),
    options: rest,
  };
}

/**
 * Search/editing layers from layers.json are global (not listed in map group trees).
 * Create a LayerInstance per map so usage APIs and legacy export can resolve them via
 * searchLayerId / editingLayerId like displayLayerId.
 */
async function populateSearchAndEditingLayerInstances() {
  const maps = await prisma.map.findMany({ select: { id: true, name: true } });
  if (maps.length === 0) {
    console.log("No maps — skipping search/editing LayerInstance seeding");
    return;
  }

  let searchInstanceCount = 0;
  let editingInstanceCount = 0;

  for (const searchLayerId of jsonToSearchLayerId.values()) {
    const searchLayer = await prisma.searchLayer.findUnique({
      where: { id: searchLayerId },
      select: { zIndex: true },
    });

    for (const map of maps) {
      const existing = await prisma.layerInstance.findFirst({
        where: { searchLayerId, mapId: map.id },
      });
      if (existing) continue;

      await prisma.layerInstance.create({
        data: {
          searchLayerId,
          mapId: map.id,
          infoClickActive: false,
          zIndex: searchLayer?.zIndex ?? 0,
        },
      });
      searchInstanceCount++;
    }
  }

  for (const editingLayerId of jsonToEditingLayerId.values()) {
    for (const map of maps) {
      const existing = await prisma.layerInstance.findFirst({
        where: { editingLayerId, mapId: map.id },
      });
      if (existing) continue;

      await prisma.layerInstance.create({
        data: {
          editingLayerId,
          mapId: map.id,
          infoClickActive: false,
        },
      });
      editingInstanceCount++;
    }
  }

  if (searchInstanceCount > 0 || editingInstanceCount > 0) {
    console.log(
      `Created ${searchInstanceCount} search and ${editingInstanceCount} editing LayerInstances across ${maps.length} map(s)`
    );
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
  // the display layer tables either). If we'd try to connect such a layer
  // to a map or group, we'd get a foreign key error. So let's wash the
  // layers so only valid entries remain.
  const displayLayersInDB = await prisma.displayLayer.findMany({
    select: { id: true },
  });

  const displayLayerIdsInDB = displayLayersInDB.map((l) => l.id);

  const removeUnknownLayers = (l) => {
    const prismaId = jsonToDisplayLayerId.get(l.layerId);
    return prismaId && displayLayerIdsInDB.includes(prismaId);
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
    const placement = layerInstancePlacementFromOptions(layer.options);
    const layerInstance = await prisma.layerInstance.create({
      data: {
        displayLayerId: jsonToDisplayLayerId.get(layer.layerId),
        mapId: layer.mapId || undefined,
        groupId: layer.groupId || undefined,
        usage: layer.usage,
        zIndex: placement.zIndex,
        visibleAtStart: placement.visibleAtStart,
        options: placement.options,
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
      case "displayLayer":
        await prisma.roleOnDisplayLayer.create({
          data: {
            displayLayer: { connect: { id: entityId } },
            role: { connect: { id: role.id } },
          },
        });
        break;
      case "searchLayer":
        await prisma.roleOnSearchLayer.create({
          data: {
            searchLayer: { connect: { id: entityId } },
            role: { connect: { id: role.id } },
          },
        });
        break;
      case "editingLayer":
        await prisma.roleOnEditingLayer.create({
          data: {
            editingLayer: { connect: { id: entityId } },
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
  // Get all layers from layers.json and insert them into the layer tables.
  await readAndPopulateLayers();
  // Search/editing layers are global in layers.json — attach them to every map via LayerInstance.
  await populateSearchAndEditingLayerInstances();
  // Finally we extract the layer switcher config from all maps and add all groups etc. with their connections to the database.
  // We're gonna want to keep crucial information such as the map layer structure separated from specific plugins such as the layer switcher.
  await populateLayerStructure();

  // Base roles (e.g. SUPERUSER, ADMIN) for map/layer/tool restrictions and future IdP group mapping.
  // Local users are not seeded: identities come from Keycloak or another external IdP.
  await createBaseRoles();

  // Seed a few test LayerInstances so the "used in maps" feature has data to display.
  // Only runs if there are no LayerInstances already (i.e. no App_Data map configs were found).
  const existingInstances = await prisma.layerInstance.count();
  if (existingInstances === 0) {
    const firstMap = await prisma.map.findFirst();
    const firstLayers = await prisma.displayLayer.findMany({ take: 3 });
    if (firstMap && firstLayers.length > 0) {
      await prisma.layerInstance.createMany({
        data: firstLayers.map((layer) => ({
          displayLayerId: layer.id,
          mapId: firstMap.id,
          usage: "FOREGROUND",
        })),
      });
      console.log(
        `Created ${firstLayers.length} test LayerInstances for map "${firstMap.name}"`
      );
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
