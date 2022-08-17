import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const mapData = [
  {
    name: "default",
    options: {},
  },
  {
    name: "secondary",
    options: {},
  },
];

const toolData = [
  {
    type: "layerswitcher",
    options: {
      target: "left",
      position: "left",
      instruction: "",
      visibleAtStart: false,
      visibleForGroups: [],
    },
  },
  {
    type: "layerswitcher",
    options: {
      target: "right",
      position: "right",
      instruction: "",
      visibleAtStart: true,
      visibleForGroups: [],
    },
  },
  {
    type: "print",
    options: {
      target: "left",
      position: "left",
      scales: "200, 400, 1000, 2000, 5000, 10000, 25000, 50000, 100000, 200000",
      logo: "/logoLight.png",
      northArrow: "/north_arrow.png",
      copyright: "© Hajkmap",
      disclaimer: "",
      mapTextColor: "#000000",
      includeNorthArrow: true,
      northArrowPlacement: "topLeft",
      includeScaleBar: true,
      scaleBarPlacement: "bottomLeft",
      includeLogo: true,
      logoPlacement: "topRight",
      instruction: "",
      visibleAtStart: false,
      visibleForGroups: [],
    },
  },
];

const projectionData = [
  {
    data: {
      code: "EPSG:3006",
      definition:
        "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
      extent: [181896.33, 6101648.07, 864416.0, 7689478.3],
      units: null,
    },
  },
  {
    data: {
      code: "EPSG:3007",
      definition:
        "+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
      extent: [60436.5084, 6192389.565, 217643.4713, 6682784.4276],
      units: null,
    },
  },
];

const toolsOnMapData = [
  {
    mapId: 1,
    toolId: 1,
    index: 1,
  },
  {
    mapId: 1,
    toolId: 2,
    index: 2,
  },
  {
    mapId: 2,
    toolId: 2,
    index: 1,
  },
];

const projectionOnMapData = [
  {
    mapId: 1,
    projectionId: 1,
  },
  {
    mapId: 1,
    projectionId: 2,
  },
  {
    mapId: 2,
    projectionId: 1,
  },
];

async function main() {
  console.log(`Start seeding ...`);
  for (const u of mapData) {
    const map = await prisma.map.create({
      data: u,
    });
    console.log(`Created map with id: ${map.id}`);
  }

  for (const u of toolData) {
    const tool = await prisma.tool.create({
      data: u,
    });
    console.log(`Created tool with id: ${tool.id}`);
  }

  for (const u of projectionData) {
    const projection = await prisma.projection.create({
      data: u,
    });
    console.log(`Created projection with id: ${projection.id}`);
  }

  for (const u of toolsOnMapData) {
    const toolOnMap = await prisma.toolsOnMaps.create({
      data: u,
    });
    console.log(`Added tool to map with id ${toolOnMap.mapId}`);
  }

  for (const u of projectionOnMapData) {
    const projectionOnMap = await prisma.projectionsOnMaps.create({
      data: u,
    });
    console.log(`Added projection to map with id ${projectionOnMap.mapId}`);
  }
  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
