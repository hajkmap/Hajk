import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import cuid from "cuid";

const prisma = new PrismaClient();

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
  await prisma.map.create({
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

  // Once the map is created, we can connect it with its tools
  const connectedTools = await prisma.toolsOnMaps.createMany({
    data: toolsToConnectToMap,
  });
  console.log(`Connected ${connectedTools.count} tools to map ${file}`);

  console.log(`END MAP CONFIG "${file}"\n\n`);
}

async function readAndPopulateLayers() {
  try {
    const pathToFile = path.join(process.cwd(), "App_Data", `layers.json`);
    const text = await fs.promises.readFile(pathToFile, "utf-8");
    const layers = await JSON.parse(text);
    for (const [key, value] of Object.entries(layers)) {
      let type = null;
      switch (key) {
        case "wmtslayers":
          type = "WMTS";
          break;
        case "wmslayers":
          type = "WMS";
          break;
        case "wfslayers":
          type = "WFS";
          break;
        case "vectorlayers":
          type = "VECTOR";
          break;
        case "wfstlayers":
          type = "WFST";
          break;
        case "arcgislayers":
          type = "ARCGIS";
          break;
      }

      const data = [];

      value.forEach((l) => {
        const { id, ...rest } = l;
        data.push({
          id,
          type,
          options: { ...rest },
        });
      });

      // Look out for duplicates!
      const dupes = data
        .map((e) => e.id)
        .filter((e, i, a) => a.indexOf(e) !== i);
      // Abort if found (we can't continue because we
      // enforce a unique constraint on the IDs in Layer model)
      if (dupes.length !== 0) {
        throw new Error(
          `Found duplicate layer id(s): ${dupes.toString()}. Please remove the duplicate entry/ies from your layers.json and retry.`
        );
      }

      const layer = await prisma.layer.createMany({
        data,
      });
      console.log(`Created ${layer.count} ${type} layers`);
    }
  } catch (error) {
    console.error(error);
  }
}

// Populates the database with the layer structure for the map corresponding to mapName
async function populateMapLayerStructure(mapName) {
  const t = await prisma.map.findUnique({
    where: {
      name: mapName,
    },
    select: {
      tools: {
        where: {
          tool: {
            type: "layerswitcher",
          },
        },
      },
    },
  });
  const { baselayers, groups } = t.tools[0].options;

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
      layerId,
      mapName,
      usage: "BACKGROUND",
      ...rest,
      visibleForGroups: !Array.isArray(bl.visibleForGroups)
        ? []
        : bl.visibleForGroups,
      infobox: typeof bl.infobox !== "string" ? "" : bl.infobox,
    });
  });

  // Helper: invoked recursively and extract any
  // layers and groups within the given group.
  const extractGroup = (group, parentId = null) => {
    // First let's handle the group's layers
    extractLayersFromGroup(group);

    // Next, let's handle the group itself
    const { id: groupId, name, toggled, expanded } = group;

    // This is a plain, flat group object - similar to layers.json
    groupsToInsert.push({
      id: groupId,
      name: name,
    });

    // Create a unique ID for this specific relation
    const newCuid = cuid();

    // This object will be used to describe this group's relations
    const groupsOnMapObject = {
      id: newCuid, // This specific group-map relations ID
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
    group.groups?.forEach((g) => extractGroup(g, newCuid));
  };

  // Helper: called by extractGroup. Grabs all layers
  // in the given group.
  const extractLayersFromGroup = (group) => {
    const layerIds = [];
    group.layers.forEach((l) => {
      const { id: layerId, ...rest } = l;

      // Prepare object to insert into layersOnGroups
      layersOnGroups.push({
        layerId,
        groupId: group.id,
        ...rest,
        visibleForGroups: !Array.isArray(group.visibleForGroups)
          ? []
          : group.visibleForGroups,
        infobox: typeof group.infobox !== "string" ? "" : group.infobox,
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
  let layersInDB = await prisma.layer.findMany({
    select: { id: true },
  });

  layersInDB = layersInDB.map((l) => l.id);

  // Helper: used as a filter predicate to remove layers
  // that did not exist in database.
  const removeUnknownLayers = (l) => {
    return layersInDB.indexOf(l.layerId) !== -1;
  };

  const validLayersOnMaps = layersOnMaps.filter(removeUnknownLayers);
  const validLayersOnGroups = layersOnGroups.filter(removeUnknownLayers);

  // Populates the Group model (the imaginative "groups.json")
  await prisma.group.createMany({
    data: groupsToInsert,
    skipDuplicates: true, // We assume - for now! - that same ID means same group, so there's no need to watch out for conflicts
  });
  // Connect each of the inserted groups to map (and another group, where applicable)
  await prisma.groupsOnMaps.createMany({ data: groupsOnMap });
  // Connect valid layers to maps (i.e. those layers that are not part of any group but part of a map)
  await prisma.layersOnMaps.createMany({ data: validLayersOnMaps });
  // Connect valid layers to groups
  await prisma.layersOnGroups.createMany({ data: validLayersOnGroups });
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

async function main() {
  // Get all layers from layers.json and insert them into the layers table.
  await readAndPopulateLayers();
  // Get all available map-config files...
  const mapConfigs = await getAvailableMaps();
  console.log("Got mapConfigs: ", mapConfigs);
  // ... and add the map configurations to the database.
  for (const mapConfig of mapConfigs) {
    await readMapConfigAndPopulateMap(mapConfig);
  }
  // Finally we extract the layer switcher config from all maps and add all groups etc. with their connections to the database.
  // We're gonna want to keep crucial information such as the map layer structure separated from specific plugins such as the layer switcher.
  await populateLayerStructure();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
