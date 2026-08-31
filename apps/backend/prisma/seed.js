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

// Known plugin types available in the client. Each Tool instance references
// one of these. Types found in map configs but missing here are upserted
// with the type name as title.
const KNOWN_TOOL_TYPES = [
  { type: "anchor", title: "Dela" },
  { type: "bookmarks", title: "Bokmärken" },
  { type: "buffer", title: "Buffra" },
  { type: "collector", title: "Tyck till" },
  { type: "coordinates", title: "Visa koordinat" },
  { type: "documenthandler", title: "Dokumenthanterare" },
  { type: "edit", title: "Redigera" },
  { type: "externalLinks", title: "Externa länkar" },
  { type: "fmeserver", title: "FME-server" },
  { type: "infoclick", title: "Infoklick" },
  { type: "infodialog", title: "Infodialog" },
  { type: "information", title: "Om kartan" },
  { type: "layercomparer", title: "Lagerjämförare" },
  { type: "layerswitcher", title: "Lagerhanterare" },
  { type: "location", title: "Positionera" },
  { type: "measure", title: "Mät" },
  { type: "measurer", title: "Mät" },
  { type: "preset", title: "Snabbval" },
  { type: "print", title: "Utskrift" },
  { type: "routing", title: "Navigation" },
  { type: "search", title: "Sök" },
  { type: "sketch", title: "Rita" },
  { type: "streetview", title: "Gatuvy" },
  { type: "timeslider", title: "Tidslinje" },
];

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

  // Take care of tools. Right now we let each map have its own Tool.
  // For layerswitcher, `options` is the full plugin config from the map JSON
  // (e.g. App_Data/map_1.json → tools[type=layerswitcher].options), including
  // nested groups/layers, baselayers, and UI flags. That JSON is the source of
  // truth for the Kartlager tree stored on Tool.options.
  console.log("Creating tools…");
  const toolsToConnectToMap = [];
  for await (const t of mapConfig.tools) {
    // Make sure the tool type exists — map configs may contain types
    // missing from KNOWN_TOOL_TYPES.
    await prisma.toolType.upsert({
      where: { type: t.type },
      update: {},
      create: { type: t.type, title: t.type },
    });

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
      },
    });

    // Add potential role restrictions on the tool
    await updateRolesFromVisibleForGroups(
      toolOptions.visibleForGroups || [],
      tool.id,
      "tool"
    );

    // Connect tool to map — target is intentionally null (unplaced).
    // Placement is managed via the admin UI, not seeded.
    toolsToConnectToMap.push({
      toolId: tool.id,
      mapName: file,
      index: t.index,
      active: toolOptions.active !== false,
    });
  }

  // Finally we can create the map
  console.log("Creating map…");
  const mapProjectionCode =
    mapConfig.map?.projection || projectionsToConnect[0]?.code || DEFAULT_PROJECTION_CODE;
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
      projections: {
        connect: projectionsToConnect,
      },
      // Tools and layers can't be connected here like projections because
      // they use explicit m-n relations (ToolsOnMaps, LayerInstance).
      // They are connected in the steps below.
    },
  });

  // Now that the map is created, we can create and connect roles that should have access to the map.
  // The "roles" (defined as groups in the .json-files) are set on the layerSwitcher...
  const layerswitcherTool = mapConfig.tools.find((t) => t.type === "layerswitcher");
  const visibleForGroups = layerswitcherTool?.options?.visibleForGroups || [];

  // Add potential role restrictions on the map
  await updateRolesFromVisibleForGroups(visibleForGroups, createdMap.id, "map");

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
 * Resolve a layers.json id or an already-remapped DisplayLayer id to the
 * Prisma DisplayLayer primary key.
 */
function resolveDisplayLayerId(jsonOrPrismaId) {
  if (jsonOrPrismaId == null || jsonOrPrismaId === "") {
    return null;
  }
  return jsonToDisplayLayerId.get(jsonOrPrismaId) ?? jsonOrPrismaId;
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
  // `index` preserves sibling order from the map JSON groups array.
  const extractGroup = (group, parentId = null, index = 0) => {
    // First let's handle the group's layers
    extractLayersFromGroup(group);

    // Next, let's handle the group itself
    const {
      id: groupId,
      name,
      toggled,
      expanded,
      exclusiveGroup,
      visibleForGroups,
    } = group;

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
      exclusiveGroup: Boolean(exclusiveGroup),
      infoDocument: Boolean(group.infogroupvisible),
      index,
      // Metadata is created below when the group has info-document fields
      _infoMetadata: groupHasInfoDocument(group)
        ? metadataFromGroupInfo(group)
        : null,
    };

    groupsOnMap.push(groupsOnMapObject);

    // Finally, recursively call on any other groups that might be in this group
    (group.groups || []).forEach((g, childIndex) =>
      extractGroup(g, newUUID, childIndex)
    );
  };

  // Helper: called by extractGroup. Grabs all layers
  // in the given group.
  const extractLayersFromGroup = (group) => {
    const layerIds = [];
    (group.layers || []).forEach((l) => {
      const { id: layerId, ...rest } = l;

      // One LayerInstance per placement: mapId (default map) + parent groupId.
      layersOnGroups.push({
        layerId: layerId,
        mapId: map.id,
        groupId: group.id,
        usage: "FOREGROUND",
        options: rest,
      });

      layerIds.push(layerId);
    });

    // Return a list of ids that relate to a given group
    return layerIds;
  };

  // Next, go on with groups, recursively — index preserves sibling order
  (groups || []).forEach((g, index) => extractGroup(g, null, index));

  // Now we have all arrays ready. One more thing left is to
  // check for consistency: our map config may refer to layerIds
  // that did not exist in layers.json (hence they won't exist in
  // the display layer tables either). If we'd try to connect such a layer
  // to a map or group, we'd get a foreign key error. So let's wash the
  // layers so only valid entries remain.
  const displayLayersInDB = await prisma.displayLayer.findMany({
    select: { id: true, zIndex: true },
  });

  const displayLayerIdsInDB = new Set(displayLayersInDB.map((l) => l.id));

  const removeUnknownLayers = (l) => {
    const prismaId = resolveDisplayLayerId(l.layerId);
    return prismaId != null && displayLayerIdsInDB.has(prismaId);
  };

  const validLayersOnMaps = layersOnMaps.filter(removeUnknownLayers);
  const validLayersOnGroups = layersOnGroups.filter(removeUnknownLayers);

  const validLayers = [...validLayersOnMaps, ...validLayersOnGroups];

  // Populates the Group model (the imaginative "groups.json")
  await prisma.group.createMany({
    data: groupsToInsert.map((g) => ({ id: g.id, name: g.name })),
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
      },
    });
  }
  // Connect valid layer instances once per placement:
  // - baselayers → mapId + BACKGROUND (no group)
  // - tree layers → mapId + parent groupId + FOREGROUND
  // Never create a second map-only row for the same display layer.
  const seededDisplayLayerIds = new Set();
  for await (const layer of validLayers) {
    const displayLayerId = resolveDisplayLayerId(layer.layerId);
    const placement = layerInstancePlacementFromOptions(layer.options);
    const layerInstance = await prisma.layerInstance.create({
      data: {
        displayLayerId,
        mapId: layer.mapId || undefined,
        groupId: layer.groupId || undefined,
        usage: layer.usage,
        zIndex: placement.zIndex,
        visibleAtStart: placement.visibleAtStart,
        options: placement.options,
      },
    });

    if (displayLayerId) {
      seededDisplayLayerIds.add(displayLayerId);
    }

    const visibleForGroups = layer.options.visibleForGroups || [];

    // Add potential role restrictions on the layer instances
    await updateRolesFromVisibleForGroups(
      visibleForGroups,
      layerInstance.id,
      "layerInstance"
    );
  }

  // Catalog display layers not referenced in baselayers/groups still get a
  // map-direct FOREGROUND instance so they show as active on the Lager tab.
  let activatedForegroundCount = 0;
  for (const [index, displayLayer] of displayLayersInDB.entries()) {
    if (seededDisplayLayerIds.has(displayLayer.id)) {
      continue;
    }

    await prisma.layerInstance.create({
      data: {
        displayLayerId: displayLayer.id,
        mapId: map.id,
        usage: "FOREGROUND",
        zIndex: displayLayer.zIndex ?? index,
        visibleAtStart: false,
      },
    });
    activatedForegroundCount += 1;
  }

  console.log(
    `Map "${mapName}": ${validLayersOnMaps.length} BACKGROUND, ${validLayersOnGroups.length} group (with mapId), ${activatedForegroundCount} map-only FOREGROUND LayerInstances`
  );

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

/**
 * Converts a title string to a URL-safe lowercase slug.
 * Mirrors the logic in server/apis/v3/utils/slugify.ts.
 */
function slugify(title) {
  const base = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
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
 * default "General" folder for each documenthandler tool.
 * Documents are now owned by a DocumentHandler Tool instance (toolId), not a map.
 */
async function seedDocuments() {
  const docsDir = path.join(process.cwd(), "App_Data", "documents");

  let entries;
  try {
    entries = await fs.promises.readdir(docsDir, { withFileTypes: true });
  } catch {
    console.log("No App_Data/documents directory found — skipping document seed.");
    return;
  }

  // Collect all documenthandler tools from the DB, keyed by their map(s).
  // We resolve a tool for each document by the doc's optional "map" field,
  // then fall back to the first documenthandler tool found.
  const dhTools = await prisma.tool.findMany({
    where: { type: "documenthandler", deletedAt: null },
    include: { maps: { select: { mapName: true } } },
  });

  if (dhTools.length === 0) {
    console.log("No documenthandler tools in DB — skipping document seed.");
    return;
  }

  // Build a lookup: mapName -> first documenthandler toolId for that map
  const toolByMapName = new Map();
  for (const tool of dhTools) {
    for (const tom of tool.maps) {
      if (!toolByMapName.has(tom.mapName)) {
        toolByMapName.set(tom.mapName, tool.id);
      }
    }
  }
  const firstToolId = dhTools[0].id;

  // Helper: determine which tool to assign a document to.
  // Use the doc's "map" field to find the map's documenthandler tool; fallback to the first tool.
  function resolveToolId(docMapField) {
    if (docMapField && toolByMapName.has(docMapField)) return toolByMapName.get(docMapField);
    return firstToolId;
  }

  // We'll track slugs per (toolId, folderId) to ensure uniqueness
  const folderSlugsByTool = new Map(); // toolId -> Set<slug>
  const docSlugsByFolder = new Map(); // folderId -> Set<slug>

  // Helper: get or create a folder for a tool
  async function getOrCreateFolder(toolId, folderTitle) {
    if (!folderSlugsByTool.has(toolId)) {
      folderSlugsByTool.set(toolId, new Set());
    }
    const existingSlugs = folderSlugsByTool.get(toolId);
    const folderSlug = uniqueSlug(slugify(folderTitle), existingSlugs);
    existingSlugs.add(folderSlug);

    const folder = await prisma.documentFolder.upsert({
      where: { toolId_name: { toolId, name: folderSlug } },
      update: {},
      create: {
        name: folderSlug,
        title: folderTitle,
        toolId,
        createdDate: new Date(),
        lastSavedDate: new Date(),
      },
    });
    console.log(`  → Folder "${folderTitle}" (${folderSlug}) in tool #${toolId}`);
    docSlugsByFolder.set(folder.id, new Set());
    return folder;
  }

  // Helper: create a document inside a folder
  async function createDocument(toolId, folderId, docTitle, content) {
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
        toolId,
        folderId,
        createdDate: new Date(),
        lastSavedDate: new Date(),
      },
    });
  }

  let totalDocs = 0;

  // Process root-level .json files (root documents → "General" folder)
  const rootJsonFiles = entries.filter(
    (e) => e.isFile() && e.name.endsWith(".json")
  );

  if (rootJsonFiles.length > 0) {
    // Group root docs by their resolved toolId so each tool gets one "General" folder
    const rootDocsByTool = new Map();
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
      const toolId = resolveToolId(doc.map);
      if (!rootDocsByTool.has(toolId)) rootDocsByTool.set(toolId, []);
      rootDocsByTool.get(toolId).push({ entry, doc });
    }

    for (const [toolId, items] of rootDocsByTool) {
      const generalFolder = await getOrCreateFolder(toolId, "General");
      for (const { entry, doc } of items) {
        const docTitle = doc.title || entry.name.replace(".json", "");
        const content = { chapters: doc.chapters ?? [] };
        await createDocument(toolId, generalFolder.id, docTitle, content);
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

    // Group by tool
    const docsByTool = new Map();
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
      const toolId = resolveToolId(doc.map);
      if (!docsByTool.has(toolId)) docsByTool.set(toolId, []);
      docsByTool.get(toolId).push({ entry, doc });
    }

    for (const [toolId, items] of docsByTool) {
      const folder = await getOrCreateFolder(toolId, subDir.name);
      for (const { entry, doc } of items) {
        const docTitle = doc.title || entry.name.replace(".json", "");
        const content = { chapters: doc.chapters ?? [] };
        await createDocument(toolId, folder.id, docTitle, content);
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

async function createToolTypes() {
  const created = await prisma.toolType.createMany({
    data: KNOWN_TOOL_TYPES,
    skipDuplicates: true,
  });
  console.log(`Created ${created.count} tool types`);
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
 * Assign sequential drawOrder indexes on layerswitcher Tool.options groups
 * layers (alphabetically by DisplayLayer name; bottom of list = 1, top = N).
 * Runs after id remapping and before GroupsOnMaps / LayerInstance population
 * so LayerInstance.zIndex picks up the same values.
 */
async function assignLayerswitcherDrawOrderIndexes() {
  const displayLayers = await prisma.displayLayer.findMany({
    select: { id: true, name: true },
  });
  const nameById = new Map(displayLayers.map((layer) => [layer.id, layer.name]));

  const tools = await prisma.tool.findMany({
    where: { type: "layerswitcher" },
    select: { id: true, options: true },
  });

  let updated = 0;

  for (const tool of tools) {
    if (
      !tool.options ||
      typeof tool.options !== "object" ||
      Array.isArray(tool.options)
    ) {
      continue;
    }

    const options = tool.options;
    if (!Array.isArray(options.groups)) {
      continue;
    }

    const layerIds = [];
    const seen = new Set();
    const collect = (groups) => {
      for (const group of groups || []) {
        for (const layer of group.layers || []) {
          const id = layer?.id;
          if (id == null || id === "" || seen.has(id)) {
            continue;
          }
          seen.add(id);
          layerIds.push(String(id));
        }
        collect(group.groups);
      }
    };
    collect(options.groups);

    if (layerIds.length === 0) {
      continue;
    }

    layerIds.sort((a, b) => {
      const nameA = nameById.get(a) ?? a;
      const nameB = nameById.get(b) ?? b;
      return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
    });

    // Top of alphabetic list = highest drawOrder; bottom = 1.
    const total = layerIds.length;
    const drawOrderById = new Map(
      layerIds.map((id, index) => [id, total - index]),
    );

    const applyDrawOrders = (groups) =>
      (groups || []).map((group) => ({
        ...group,
        layers: (group.layers || []).map((layer) => {
          const id = layer?.id != null ? String(layer.id) : null;
          if (id == null || !drawOrderById.has(id)) {
            return layer;
          }
          return {
            ...layer,
            drawOrder: drawOrderById.get(id),
          };
        }),
        groups: applyDrawOrders(group.groups),
      }));

    await prisma.tool.update({
      where: { id: tool.id },
      data: {
        options: {
          ...options,
          groups: applyDrawOrders(options.groups),
        },
      },
    });
    updated += 1;
  }

  if (updated > 0) {
    console.log(
      `Assigned alphabetic drawOrder indexes (bottom = 1) on ${updated} layerswitcher Tool.options`,
    );
  }
}

/**
 * After DisplayLayer rows exist, rewrite layerswitcher Tool.options so layer
 * ids match Prisma DisplayLayer ids (catalog / Kartlager lookups).
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
      jsonToDisplayLayerId
    );
    await prisma.tool.update({
      where: { id: tool.id },
      data: { options: remapped },
    });
    updated += 1;
  }

  if (updated > 0) {
    console.log(
      `Remapped layer ids in ${updated} layerswitcher Tool.options to DisplayLayer ids`
    );
  }
}

async function main() {
  // The known plugin types — Tool instances reference these via FK.
  await createToolTypes();
  // Get all available map-config files...
  const mapConfigs = await getAvailableMaps();
  // ... and add the map configurations to the database.
  for (const mapConfig of mapConfigs) {
    await readMapConfigAndPopulateMap(mapConfig);
  }
  // Get all layers from layers.json and insert them into the layer tables.
  await readAndPopulateLayers();
  // Rewrite layerswitcher Tool.options layer ids to Prisma DisplayLayer ids
  // before building GroupsOnMaps / LayerInstances from those options.
  await remapLayerswitcherToolOptionsLayerIds();
  // Assign sequential drawOrder (bottom = 1, alphabetic) on groups[].layers[]
  // so LayerInstance.zIndex and Tool.options stay aligned for Ritordning.
  await assignLayerswitcherDrawOrderIndexes();
  // Search/editing layers are global in layers.json — attach them to every map via LayerInstance.
  await populateSearchAndEditingLayerInstances();
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
