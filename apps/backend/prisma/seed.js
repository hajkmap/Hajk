import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

if (!process.env.PG_CONNECTION_STRING) {
  throw new Error("PG_CONNECTION_STRING must be set before seeding.");
}

const getSchemaFromConnectionString = (connectionString) => {
  try {
    return new URL(connectionString).searchParams.get("schema") ?? undefined;
  } catch {
    return undefined;
  }
};

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    {
      connectionString: process.env.PG_CONNECTION_STRING,
    },
    { schema: getSchemaFromConnectionString(process.env.PG_CONNECTION_STRING) }
  ),
});

const DEFAULT_PROJECTION_CODE = "EPSG:3006";

// Shared timestamp for every row this script creates — a seed run happens
// "now" for audit purposes, there's no real per-row creation time to track.
const SEED_TIMESTAMP = new Date();

// Maps a legacy layers.json id to the Prisma Layer id it was seeded as.
const jsonToLayerId = new Map();

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

  // Take care of tools. Right now we let each map have its own Tool.
  // For layerswitcher, `options` is the full plugin config from the map JSON
  // (e.g. App_Data/map_1.json → tools[type=layerswitcher].options), including
  // nested groups/layers, baselayers, and UI flags. That JSON is the source of
  // truth for the Kartlager tree stored on Tool.options.
  console.log("Creating tools…");
  const toolsToConnectToMap = [];
  for await (const t of mapConfig.tools) {
    const toolOptions = t.options ?? {};
    if (t.type === "layerswitcher") {
      const groupCount = Array.isArray(toolOptions.groups)
        ? toolOptions.groups.length
        : 0;
      const baselayerCount = Array.isArray(toolOptions.baselayers)
        ? toolOptions.baselayers.length
        : 0;
      console.log(
        `  layerswitcher options from ${file}.json: ${groupCount} root group(s), ${baselayerCount} baselayer(s)`
      );
    }

    const tool = await prisma.tool.create({
      data: {
        type: t.type,
        title: toolOptions.title ?? null,
        options: toolOptions,
        createdDate: SEED_TIMESTAMP,
        lastSavedDate: SEED_TIMESTAMP,
      },
    });

    // Add potential role restrictions on the tool
    await updateRolesFromVisibleForGroups(
      toolOptions.visibleForGroups || [],
      tool.id,
      "tool"
    );

    // Connect tool to map — target is intentionally left unset (unplaced).
    // Placement is managed via the admin UI, not seeded. mapId is filled in
    // below, once the map itself has been created.
    toolsToConnectToMap.push({ toolId: tool.id, index: t.index });
  }

  // Finally we can create the map
  console.log("Creating map…");
  const mapProjectionCode =
    mapConfig.map?.projection ||
    projectionsToConnect[0]?.code ||
    DEFAULT_PROJECTION_CODE;
  const mapProjection = await prisma.projection.findUnique({
    where: { code: mapProjectionCode },
  });
  const createdMap = await prisma.map.create({
    data: {
      name: file, // We use the file name as our unique map identifier
      options: mapConfig.map, // Put all map options as-is, as JSON
      ...(mapProjection
        ? { projection: { connect: { id: mapProjection.id } } }
        : {}),
      createdDate: SEED_TIMESTAMP,
      lastSavedDate: SEED_TIMESTAMP,
    },
  });

  // Now that the map is created, we can create and connect roles that should have access to the map.
  // The "roles" (defined as groups in the .json-files) are set on the layerSwitcher...
  const layerswitcherTool = mapConfig.tools.find(
    (t) => t.type === "layerswitcher"
  );
  const visibleForGroups = layerswitcherTool?.options?.visibleForGroups || [];

  // Add potential role restrictions on the map
  await updateRolesFromVisibleForGroups(visibleForGroups, createdMap.id, "map");

  const connectedTools = await prisma.toolInstance.createMany({
    data: toolsToConnectToMap.map((t) => ({
      toolId: t.toolId,
      mapId: createdMap.id,
      index: t.index,
      createdDate: SEED_TIMESTAMP,
      lastSavedDate: SEED_TIMESTAMP,
    })),
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

// Decides which extra fields (beyond the common core) get populated on the
// unified Layer row below — a straight port of the pre-unification
// DisplayLayer/SearchLayer/EditingLayer split, now writing into one table
// (with kind-specific config folded into `options`) instead of three.
const LAYER_KIND_BY_JSON_KEY = {
  wmslayers: "display",
  wmtslayers: "display",
  vectorlayers: "display",
  arcgislayers: "display",
  wfslayers: "search",
  wfstlayers: "editing",
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
          metadata: {
            create: {
              owner: owner,
              createdDate: SEED_TIMESTAMP,
              lastSavedDate: SEED_TIMESTAMP,
            },
          },
          projection: {
            connect: { code: projection || DEFAULT_PROJECTION_CODE },
          },
          createdDate: SEED_TIMESTAMP,
          lastSavedDate: SEED_TIMESTAMP,
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

        // `active`/`metadata` stay undefined unless the branch below sets
        // them — Layer.active defaults to false, and editing-kind layers
        // never get a Metadata row (mirrors the pre-unification behavior).
        let active;
        let metadata;
        const options = {};

        if (layerKind === "search") {
          active = Boolean(
            layer.searchUrl ||
              (Array.isArray(layer.searchFields) &&
                layer.searchFields.length > 0)
          );
          // Shared with "editing" — not namespaced under options.search.
          options.geometryField =
            layer.geometryField || layer.searchGeometryField;
          options.search = {
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
            outputFormat: layer.outputFormat || "GML3",
            aliasDict: layer.aliasDict,
            infobox: layer.infobox,
          };
          metadata = {
            title: layer.infoTitle,
            description: layer.infoText,
            url: layer.infoUrl,
            urlTitle: layer.infoUrlText,
            owner: layer.infoOwner,
            urlOpenData: layer.infoOpenDataLink,
            visible: Boolean(layer.infoVisible),
            createdDate: SEED_TIMESTAMP,
            lastSavedDate: SEED_TIMESTAMP,
          };
        } else if (layerKind === "editing") {
          options.geometryField =
            layer.geometryField || layer.searchGeometryField;
          options.editPoint = layer.editPoint;
          options.editMultiPoint = layer.editMultiPoint;
          options.editLine = layer.editLine;
          options.editMultiLine = layer.editMultiLine;
          options.editPolygon = layer.editPolygon;
          options.editMultiPolygon = layer.editMultiPolygon;
          options.allowMultipleGeometries = layer.allowMultipleGeometries;
          options.editableFields = layer.editableFields;
          options.nonEditableFields = layer.nonEditableFields;
        } else {
          // display
          options.legend = layer.legend;
          options.legendIcon = layer.legendIcon;
          options.opacity = layer.opacity;
          options.minZoom = layer.minZoom;
          options.maxZoom = layer.maxZoom;
          options.minMaxZoomAlertOnToggleOnly =
            layer.minMaxZoomAlertOnToggleOnly;
          options.customRatio = layer.customRatio;
          options.timeSliderVisible = layer.timeSliderVisible;
          options.timeSliderStart = layer.timeSliderStart;
          options.timeSliderEnd = layer.timeSliderEnd;
          options.singleTile = layer.singleTile;
          options.tiled = layer.tiled;
          options.hidpi = layer.hidpi;
          options.style = layer.style;
          options.hideExpandArrow = layer.hideExpandArrow;
          options.useCustomDpiList = layer.useCustomDpiList;
          options.customDpiList = layer.customDpiList;
          // Verbatim per-sublayer array (caption/legend/infobox/style/
          // queryable) — a WMS entry can carry more than one sublayer, so
          // this isn't flattened into a single column.
          options.layersInfo = layer.layersInfo;
          options.infoClick = {
            format: layer.infoFormat,
            sortProperty: layer.infoClickSortProperty,
            sortMethod: layer.infoClickSortType,
            sortDescending: layer.infoClickSortDesc,
          };
          metadata = {
            title: layer.infoTitle,
            description: layer.infoText,
            url: layer.infoUrl,
            urlTitle: layer.infoUrlText,
            owner: layer.infoOwner,
            urlOpenData: layer.infoOpenDataLink,
            visible: Boolean(layer.infoVisible),
            createdDate: SEED_TIMESTAMP,
            lastSavedDate: SEED_TIMESTAMP,
          };
        }

        const createdLayer = await prisma.layer.create({
          data: {
            name: layer.caption,
            internalName: layer.internalLayerName || generateRandomName(),
            selectedLayers,
            zIndex: layer.zIndex ?? 0,
            ...(active !== undefined ? { active } : {}),
            service: { connect: { id: service.id } },
            ...(metadata ? { metadata: { create: metadata } } : {}),
            options,
            createdDate: SEED_TIMESTAMP,
            lastSavedDate: SEED_TIMESTAMP,
          },
        });

        jsonToLayerId.set(layer.id, createdLayer.id);
      }

      console.log(
        `Created ${cleanedLayers.length} ${type} (${layerKind}) layer(s)`
      );

      for await (const layer of cleanedLayers) {
        const prismaId = jsonToLayerId.get(layer.id);
        if (!prismaId) continue;
        await updateRolesFromVisibleForGroups(
          layer.visibleForGroups || [],
          prismaId,
          "layer"
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

function groupHasInfoDocument(group) {
  return Boolean(
    group.infogroupvisible ||
      group.infogrouptitle ||
      group.infogrouptext ||
      group.infogroupurl ||
      group.infogroupurltext ||
      group.infogroupopendatalink ||
      group.infogroupowner
  );
}

function metadataFromGroupInfo(group) {
  return {
    title: group.infogrouptitle || null,
    description: group.infogrouptext || null,
    owner: group.infogroupowner || null,
    url: group.infogroupurl || null,
    urlTitle: group.infogroupurltext || null,
    urlOpenData: group.infogroupopendatalink || null,
    visible: Boolean(group.infogroupvisible),
    createdDate: SEED_TIMESTAMP,
    lastSavedDate: SEED_TIMESTAMP,
  };
}

// Populates the database with the layer structure for the map corresponding to mapName.
// Source: the layerswitcher Tool.options seeded from App_Data/<mapName>.json
// (e.g. map_1.json tools[].options.groups / .baselayers).
async function populateMapLayerStructure(mapName) {
  const map = await prisma.map.findUnique({
    where: { name: mapName },
    select: {
      id: true,
      tools: {
        where: { tool: { type: "layerswitcher" } },
        include: { tool: true },
        orderBy: { index: "asc" },
      },
    },
  });

  const layerswitcherOnMap = map?.tools?.[0];
  if (!layerswitcherOnMap?.tool?.options) {
    console.log(
      `No layerswitcher tool options for map "${mapName}" — skipping layer structure`
    );
    return;
  }

  const { baselayers = [], groups = [] } = layerswitcherOnMap.tool.options;
  console.log(
    `Populating layer structure for "${mapName}" from layerswitcher Tool.options (${groups.length} root groups, ${(baselayers || []).length} baselayers)`
  );

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
  (baselayers || []).forEach((bl) => {
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
  // Note: sibling order within a group isn't persisted — GroupsOnMaps has no
  // sort-index column (a pre-existing schema gap, not addressed here).
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
      toggled: Boolean(toggled),
      expanded: Boolean(expanded),
      // Metadata is created below when the group has info-document fields
      _infoMetadata: groupHasInfoDocument(group)
        ? metadataFromGroupInfo(group)
        : null,
    };

    groupsOnMap.push(groupsOnMapObject);

    // Finally, recursively call on any other groups that might be in this group
    (group.groups || []).forEach((g) => extractGroup(g, newUUID));
  };

  // Helper: called by extractGroup. Grabs all layers
  // in the given group.
  const extractLayersFromGroup = (group) => {
    const layerIds = [];
    (group.layers || []).forEach((l) => {
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
  (groups || []).forEach((g) => extractGroup(g, null));

  // Now we have all arrays ready. One more thing left is to
  // check for consistency: our map config may refer to layerIds
  // that did not exist in layers.json (hence they won't exist in
  // the Layer table either). If we'd try to connect such a layer
  // to a map or group, we'd get a foreign key error. So let's wash the
  // layers so only valid entries remain.
  //
  // Note: `l.layerId` here is already a real Layer id, not a raw layers.json
  // id — remapLayerswitcherToolOptionsLayerIds() rewrote Tool.options (which
  // this function reads from) before we got here, so no jsonToLayerId lookup
  // is needed at this point.
  const layersInDB = await prisma.layer.findMany({
    select: { id: true },
  });

  const layerIdsInDB = layersInDB.map((l) => l.id);

  const removeUnknownLayers = (l) => layerIdsInDB.includes(l.layerId);

  const validLayersOnMaps = layersOnMaps.filter(removeUnknownLayers);
  const validLayersOnGroups = layersOnGroups.filter(removeUnknownLayers);

  const validLayers = [...validLayersOnMaps, ...validLayersOnGroups];

  // Populates the Group model (the imaginative "groups.json")
  await prisma.group.createMany({
    data: groupsToInsert.map((g) => ({
      id: g.id,
      name: g.name,
      createdDate: SEED_TIMESTAMP,
      lastSavedDate: SEED_TIMESTAMP,
    })),
    skipDuplicates: true, // We assume - for now! - that same ID means same group, so there's no need to watch out for conflicts
  });

  // Connect each of the inserted groups to map (and another group, where applicable).
  // Create Metadata rows first when the map JSON has info-document fields.
  for (const placement of groupsOnMap) {
    const { _infoMetadata, ...groupsOnMapData } = placement;
    let metadataId = null;

    if (_infoMetadata) {
      const metadata = await prisma.metadata.create({
        data: _infoMetadata,
      });
      metadataId = metadata.id;
    }

    await prisma.groupsOnMaps.create({
      data: {
        ...groupsOnMapData,
        metadataId,
        createdDate: SEED_TIMESTAMP,
        lastSavedDate: SEED_TIMESTAMP,
      },
    });
  }
  // Connect valid layer instances (i.e. those layers that are used in maps (background) or groups (foreground))
  for await (const layer of validLayers) {
    const placement = layerInstancePlacementFromOptions(layer.options);
    const layerInstance = await prisma.layerInstance.create({
      data: {
        layerId: layer.layerId,
        mapId: layer.mapId || undefined,
        groupId: layer.groupId || undefined,
        usage: layer.usage,
        zIndex: placement.zIndex,
        visibleAtStart: placement.visibleAtStart,
        options: placement.options,
        createdDate: SEED_TIMESTAMP,
        lastSavedDate: SEED_TIMESTAMP,
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
        createdDate: SEED_TIMESTAMP,
        lastSavedDate: SEED_TIMESTAMP,
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
      create: {
        code: group,
        title: group,
        description: group,
        createdDate: SEED_TIMESTAMP,
        lastSavedDate: SEED_TIMESTAMP,
      },
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

/**
 * Converts a title string to a URL-safe lowercase slug.
 * Mirrors the logic in server/apis/v3/utils/slugify.ts.
 */
function slugify(title) {
  const base = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return base || "item";
}

function uniqueSlug(base, existingSet) {
  if (!existingSet.has(base)) return base;
  let n = 2;
  while (existingSet.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/**
 * Seeds DocumentFolder + Document rows from legacy App_Data/documents/*.json files.
 * Legacy documents can be at root level or inside a single subfolder level.
 * Since documents now require a folder, root-level docs are placed in a
 * default "General" folder for each map.
 * Documents are owned by a Map (mapName), resolved via which map has a
 * documenthandler tool — the doc's own optional "map" field picks a specific
 * one when present, falling back to the first map found otherwise.
 */
async function seedDocuments() {
  const docsDir = path.join(process.cwd(), "App_Data", "documents");

  let entries;
  try {
    entries = await fs.promises.readdir(docsDir, { withFileTypes: true });
  } catch {
    console.log(
      "No App_Data/documents directory found — skipping document seed."
    );
    return;
  }

  // Collect all maps that have a documenthandler tool instance.
  const dhToolInstances = await prisma.toolInstance.findMany({
    where: { tool: { type: "documenthandler", deletedAt: null } },
    select: { map: { select: { name: true } } },
  });

  if (dhToolInstances.length === 0) {
    console.log(
      "No documenthandler tool instances in DB — skipping document seed."
    );
    return;
  }

  const mapNamesWithDocHandler = new Set(
    dhToolInstances.map((ti) => ti.map.name)
  );
  const firstMapName = dhToolInstances[0].map.name;

  // Helper: determine which map to assign a document to.
  // Use the doc's "map" field when it names a map that has a
  // documenthandler tool; fallback to the first such map.
  function resolveMapName(docMapField) {
    if (docMapField && mapNamesWithDocHandler.has(docMapField))
      return docMapField;
    return firstMapName;
  }

  // We'll track slugs per (mapName, folderId) to ensure uniqueness
  const folderSlugsByMap = new Map(); // mapName -> Set<slug>
  const docSlugsByFolder = new Map(); // folderId -> Set<slug>

  // Helper: get or create a folder for a map
  async function getOrCreateFolder(mapName, folderTitle) {
    if (!folderSlugsByMap.has(mapName)) {
      folderSlugsByMap.set(mapName, new Set());
    }
    const existingSlugs = folderSlugsByMap.get(mapName);
    const folderSlug = uniqueSlug(slugify(folderTitle), existingSlugs);
    existingSlugs.add(folderSlug);

    const folder = await prisma.documentFolder.upsert({
      where: { mapName_name: { mapName, name: folderSlug } },
      update: {},
      create: {
        name: folderSlug,
        title: folderTitle,
        mapName,
        createdDate: SEED_TIMESTAMP,
        lastSavedDate: SEED_TIMESTAMP,
      },
    });
    console.log(
      `  → Folder "${folderTitle}" (${folderSlug}) on map "${mapName}"`
    );
    docSlugsByFolder.set(folder.id, new Set());
    return folder;
  }

  // Helper: create a document inside a folder
  async function createDocument(mapName, folderId, docTitle, content) {
    if (!docSlugsByFolder.has(folderId)) {
      docSlugsByFolder.set(folderId, new Set());
    }
    const existingSlugs = docSlugsByFolder.get(folderId);
    const docSlug = uniqueSlug(slugify(docTitle), existingSlugs);
    existingSlugs.add(docSlug);

    await prisma.document.create({
      data: {
        name: docSlug,
        title: docTitle,
        content,
        mapName,
        folderId,
        createdDate: SEED_TIMESTAMP,
        lastSavedDate: SEED_TIMESTAMP,
      },
    });
  }

  let totalDocs = 0;

  // Process root-level .json files (root documents → "General" folder)
  const rootJsonFiles = entries.filter(
    (e) => e.isFile() && e.name.endsWith(".json")
  );

  if (rootJsonFiles.length > 0) {
    // Group root docs by their resolved mapName so each map gets one "General" folder
    const rootDocsByMap = new Map();
    for (const entry of rootJsonFiles) {
      const filePath = path.join(docsDir, entry.name);
      const text = await fs.promises.readFile(filePath, "utf-8");
      let doc;
      try {
        doc = JSON.parse(text);
      } catch {
        console.warn(`  Skipping invalid JSON: ${entry.name}`);
        continue;
      }
      const mapName = resolveMapName(doc.map);
      if (!rootDocsByMap.has(mapName)) rootDocsByMap.set(mapName, []);
      rootDocsByMap.get(mapName).push({ entry, doc });
    }

    for (const [mapName, items] of rootDocsByMap) {
      const generalFolder = await getOrCreateFolder(mapName, "General");
      for (const { entry, doc } of items) {
        const docTitle = doc.title || entry.name.replace(".json", "");
        const content = { chapters: doc.chapters ?? [] };
        await createDocument(mapName, generalFolder.id, docTitle, content);
        console.log(`    • "${docTitle}" → General`);
        totalDocs++;
      }
    }
  }

  // Process subdirectory-level documents (folder name = subdirectory name)
  const subDirs = entries.filter((e) => e.isDirectory());
  for (const subDir of subDirs) {
    const subDirPath = path.join(docsDir, subDir.name);
    const subEntries = await fs.promises.readdir(subDirPath, {
      withFileTypes: true,
    });
    const subJsonFiles = subEntries.filter(
      (e) => e.isFile() && e.name.endsWith(".json")
    );
    if (subJsonFiles.length === 0) continue;

    // Group by map
    const docsByMap = new Map();
    for (const entry of subJsonFiles) {
      const filePath = path.join(subDirPath, entry.name);
      const text = await fs.promises.readFile(filePath, "utf-8");
      let doc;
      try {
        doc = JSON.parse(text);
      } catch {
        console.warn(`  Skipping invalid JSON: ${subDir.name}/${entry.name}`);
        continue;
      }
      const mapName = resolveMapName(doc.map);
      if (!docsByMap.has(mapName)) docsByMap.set(mapName, []);
      docsByMap.get(mapName).push({ entry, doc });
    }

    for (const [mapName, items] of docsByMap) {
      const folder = await getOrCreateFolder(mapName, subDir.name);
      for (const { entry, doc } of items) {
        const docTitle = doc.title || entry.name.replace(".json", "");
        const content = { chapters: doc.chapters ?? [] };
        await createDocument(mapName, folder.id, docTitle, content);
        console.log(`    • "${docTitle}" → ${subDir.name}`);
        totalDocs++;
      }
    }
  }

  if (totalDocs > 0) {
    console.log(`Seeded ${totalDocs} document(s) from App_Data/documents/`);
  } else {
    console.log("No legacy documents found to seed.");
  }
}

function remapLayerIdInLayerswitcherOptions(options, idMap) {
  if (!options || typeof options !== "object") {
    return options;
  }

  const remapLayerRef = (layer) => {
    if (!layer || typeof layer !== "object") {
      return layer;
    }
    const nextId = idMap.get(layer.id);
    return nextId ? { ...layer, id: nextId } : layer;
  };

  const remapGroup = (group) => {
    if (!group || typeof group !== "object") {
      return group;
    }
    return {
      ...group,
      layers: Array.isArray(group.layers)
        ? group.layers.map(remapLayerRef)
        : group.layers,
      groups: Array.isArray(group.groups)
        ? group.groups.map(remapGroup)
        : group.groups,
    };
  };

  const next = { ...options };

  if (Array.isArray(next.groups)) {
    next.groups = next.groups.map(remapGroup);
  }

  if (Array.isArray(next.baselayers)) {
    next.baselayers = next.baselayers.map(remapLayerRef);
  }

  if (Array.isArray(next.quickAccessPresets)) {
    next.quickAccessPresets = next.quickAccessPresets.map((preset) => {
      if (!preset || typeof preset !== "object") {
        return preset;
      }
      return {
        ...preset,
        layers: Array.isArray(preset.layers)
          ? preset.layers.map(remapLayerRef)
          : preset.layers,
      };
    });
  }

  return next;
}

/**
 * After Layer rows exist, rewrite layerswitcher Tool.options so layer ids
 * match Prisma Layer ids (catalog / Kartlager lookups).
 */
async function remapLayerswitcherToolOptionsLayerIds() {
  const tools = await prisma.tool.findMany({
    where: { type: "layerswitcher" },
    select: { id: true, options: true },
  });

  let updated = 0;
  for (const tool of tools) {
    const remapped = remapLayerIdInLayerswitcherOptions(
      tool.options,
      jsonToLayerId
    );
    await prisma.tool.update({
      where: { id: tool.id },
      data: { options: remapped },
    });
    updated += 1;
  }

  if (updated > 0) {
    console.log(
      `Remapped layer ids in ${updated} layerswitcher Tool.options to Layer ids`
    );
  }
}

async function main() {
  // Get all available map-config files...
  const mapConfigs = await getAvailableMaps();
  // ... and add the map configurations to the database.
  for (const mapConfig of mapConfigs) {
    await readMapConfigAndPopulateMap(mapConfig);
  }
  // Get all layers from layers.json and insert them into the Layer table.
  await readAndPopulateLayers();
  // Rewrite layerswitcher Tool.options layer ids to Prisma Layer ids
  // before building GroupsOnMaps / LayerInstances from those options.
  await remapLayerswitcherToolOptionsLayerIds();
  // Finally we extract the layer switcher config from all maps and add all groups etc. with their connections to the database.
  // We're gonna want to keep crucial information such as the map layer structure separated from specific plugins such as the layer switcher.
  await populateLayerStructure();

  // Base roles (e.g. SUPERUSER, ADMIN) for map/layer/tool restrictions and future IdP group mapping.
  // Local users are not seeded: identities come from Keycloak or another external IdP.
  await createBaseRoles();

  // Seed documents from App_Data/documents/ into DocumentFolder + Document tables.
  await seedDocuments();

  // Seed a few test LayerInstances so the "used in maps" feature has data to display.
  // Only runs if there are no LayerInstances already (i.e. no App_Data map configs were found).
  const existingInstances = await prisma.layerInstance.count();
  if (existingInstances === 0) {
    const firstMap = await prisma.map.findFirst();
    const firstLayers = await prisma.layer.findMany({ take: 3 });
    if (firstMap && firstLayers.length > 0) {
      await prisma.layerInstance.createMany({
        data: firstLayers.map((layer) => ({
          layerId: layer.id,
          mapId: firstMap.id,
          usage: "FOREGROUND",
          createdDate: SEED_TIMESTAMP,
          lastSavedDate: SEED_TIMESTAMP,
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
