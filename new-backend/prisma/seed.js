import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

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

async function main() {
  await readAndPopulateLayers();
  const mapConfigs = await getAvailableMaps();
  console.log("Got mapConfigs: ", mapConfigs);
  for (const mapConfig of mapConfigs) {
    await readMapConfigAndPopulateMap(mapConfig);
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
