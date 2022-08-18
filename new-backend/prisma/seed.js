import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const projectionData = [
  {
    code: "EPSG:3006",
    definition:
      "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [181896.33, 6101648.07, 864416, 7689478.3],
    units: null,
  },
  {
    code: "http://www.opengis.net/gml/srs/epsg.xml#3006",
    definition:
      "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [181896.33, 6101648.07, 864416, 7689478.3],
    units: null,
  },
  {
    code: "EPSG:3007",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [60436.5084, 6192389.565, 217643.4713, 6682784.4276],
    units: null,
  },
  {
    code: "http://www.opengis.net/gml/srs/epsg.xml#3007",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [60436.5084, 6192389.565, 217643.4713, 6682784.4276],
    units: null,
  },
  {
    code: "EPSG:3008",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=13.5 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs ",
    extent: [60857.4994, 6120098.8505, 223225.0217, 6906693.7888],
    units: null,
  },
  {
    code: "http://www.opengis.net/gml/srs/epsg.xml#3008",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=13.5 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs ",
    extent: [60857.4994, 6120098.8505, 223225.0217, 6906693.7888],
    units: null,
  },
  {
    code: "EPSG:3009",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=15 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [56294.0365, 6203542.5282, 218719.0581, 6835499.2391],
    units: null,
  },
  {
    code: "http://www.opengis.net/gml/srs/epsg.xml#3009",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=15 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [56294.0365, 6203542.5282, 218719.0581, 6835499.2391],
    units: null,
  },
  {
    code: "EPSG:3010",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=16.5 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [97213.6352, 6228930.1419, 225141.8681, 6916524.0785],
    units: null,
  },
  {
    code: "http://www.opengis.net/gml/srs/epsg.xml#3010",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=16.5 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [97213.6352, 6228930.1419, 225141.8681, 6916524.0785],
    units: null,
  },
  {
    code: "EPSG:3011",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=18 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [96664.5565, 6509617.2232, 220146.6914, 6727103.5879],
    units: null,
  },
  {
    code: "http://www.opengis.net/gml/srs/epsg.xml#3011",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=18 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [96664.5565, 6509617.2232, 220146.6914, 6727103.5879],
    units: null,
  },
  {
    code: "EPSG:3012",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=14.25 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [30462.5263, 6829647.9842, 216416.1584, 7154168.0208],
    units: null,
  },
  {
    code: "http://www.opengis.net/gml/srs/epsg.xml#3012",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=14.25 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [30462.5263, 6829647.9842, 216416.1584, 7154168.0208],
    units: null,
  },
  {
    code: "EPSG:3013",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=15.75 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs ",
    extent: [34056.6264, 6710433.2884, 218692.0214, 7224144.732],
    units: null,
  },
  {
    code: "http://www.opengis.net/gml/srs/epsg.xml#3013",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=15.75 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs ",
    extent: [34056.6264, 6710433.2884, 218692.0214, 7224144.732],
    units: null,
  },
  {
    code: "EPSG:3014",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=17.25 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [-1420.28, 6888655.5779, 212669.1333, 7459585.3378],
    units: null,
  },
  {
    code: "http://www.opengis.net/gml/srs/epsg.xml#3014",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=17.25 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [-1420.28, 6888655.5779, 212669.1333, 7459585.3378],
    units: null,
  },
  {
    code: "EPSG:3015",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=18.75 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [58479.4774, 6304213.2147, 241520.5226, 7276832.4419],
    units: null,
  },
  {
    code: "http://www.opengis.net/gml/srs/epsg.xml#3015",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=18.75 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [58479.4774, 6304213.2147, 241520.5226, 7276832.4419],
    units: null,
  },
  {
    code: "EPSG:3016",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=20.25 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [-93218.3385, 7034909.8738, 261434.6246, 7676279.8691],
    units: null,
  },
  {
    code: "http://www.opengis.net/gml/srs/epsg.xml#3016",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=20.25 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [-93218.3385, 7034909.8738, 261434.6246, 7676279.8691],
    units: null,
  },
  {
    code: "EPSG:3017",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=21.75 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [67451.0699, 7211342.8483, 145349.5699, 7254837.254],
    units: null,
  },
  {
    code: "http://www.opengis.net/gml/srs/epsg.xml#3017",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=21.75 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [67451.0699, 7211342.8483, 145349.5699, 7254837.254],
    units: null,
  },
  {
    code: "EPSG:3018",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=23.25 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [38920.7048, 7267405.2323, 193050.246, 7597992.2419],
    units: null,
  },
  {
    code: "http://www.opengis.net/gml/srs/epsg.xml#3018",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=23.25 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [38920.7048, 7267405.2323, 193050.246, 7597992.2419],
    units: null,
  },
  {
    code: "EPSG:3021",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=15.80827777777778 +k=1 +x_0=1500000 +y_0=0 +ellps=bessel +units=m +no_defs",
    extent: [1392811.0743, 6208496.7665, 1570600.8906, 7546077.6984],
    units: null,
  },
  {
    code: "http://www.opengis.net/gml/srs/epsg.xml#3021",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=15.80827777777778 +k=1 +x_0=1500000 +y_0=0 +ellps=bessel +units=m +no_defs",
    extent: [1392811.0743, 6208496.7665, 1570600.8906, 7546077.6984],
    units: null,
  },
];

const mapData = [
  {
    name: "default",
    options: {
      target: "map",
      center: [110600, 6283793],
      title: "Standardkartan",
      projection: "EPSG:3008",
      zoom: 2,
      maxZoom: 10,
      minZoom: 0,
      resolutions: [
        55.99999999999999, 27.999999999999996, 13.999999999999998,
        6.999999999999999, 4.199999999999999, 2.8, 1.4, 0.5599999999999999,
        0.28, 0.112, 0.056,
      ],
      origin: [72595.7168, 6269051.84184],
      extent: [72595.7168, 6269051.84184, 139282.1317, 6313912.82227],
      constrainOnlyCenter: true,
      constrainResolution: true,
      enableDownloadLink: false,
      logo: "logoLight.png",
      geoserverLegendOptions:
        "fontName:Roboto;fontAntiAliasing:true;fontColor:0x333333;fontSize:14;dpi:90;forceLabels:on",
      mapselector: true,
      mapcleaner: true,
      drawerVisible: false,
      drawerPermanent: false,
      colors: {
        primaryColor: "#4a90e2",
        secondaryColor: "#ffffff",
      },
      defaultCookieNoticeMessage:
        "Vi använder cookies för att följa upp användandet och ge en bra upplevelse av kartan. Du kan blockera cookies i webbläsaren men då visas detta meddelande igen.",
      defaultCookieNoticeUrl:
        "https://pts.se/sv/bransch/regler/lagar/lag-om-elektronisk-kommunikation/kakor-cookies/",
      crossOrigin: "anonymous",
      showCookieNotice: false,
      logoLight: "logoLight.png",
      logoDark: "logoDark.png",
      showThemeToggler: true,
      drawerVisibleMobile: false,
      activeDrawerOnStart: "plugins",
      altShiftDragRotate: true,
      onFocusOnly: false,
      doubleClickZoom: true,
      keyboard: true,
      mouseWheelZoom: true,
      shiftDragZoom: true,
      dragPan: true,
      pinchRotate: true,
      pinchZoom: true,
      zoomDelta: null,
      zoomDuration: null,
      mapresetter: false,
      showUserAvatar: true,
    },
    projections: {
      connect: [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
        { id: 6 },
      ],
    },
  },
  {
    name: "secondary",
    options: {},
    projections: {
      connect: [{ id: 1 }, { id: 2 }],
    },
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
  {
    type: "measure",
    options: {
      target: "control",
      instruction: "",
      icons: "",
    },
  },
  {
    type: "anchor",
    options: {
      target: "toolbar",
      instruction: "",
      visibleForGroups: [],
    },
  },
  {
    type: "buffer",
    options: {
      target: "toolbar",
      instruction: "",
      varbergVer: false,
      geoserverUrl: "",
      notFeatureLayers: [],
      visibleForGroups: [],
    },
  },
  {
    type: "infoclick",
    options: {
      title: "Information",
      position: "right",
      width: 400,
      height: "dynamic",
      anchor: [0.5, 1],
      scale: 0.15,
      src: "",
      strokeColor: {
        r: 200,
        b: 0,
        g: 0,
        a: 0.7,
      },
      strokeWidth: 4,
      fillColor: {
        r: 255,
        b: 0,
        g: 0,
        a: 0.1,
      },
      allowDangerousHtml: true,
      useNewInfoclick: true,
      visibleForGroups: [],
    },
  },
  {
    type: "coordinates",
    options: {
      target: "toolbar",
      instruction: "",
      transformations: [
        {
          code: "EPSG:3008",
          precision: "3",
          default: true,
          hint: "Sweref 99 13 30",
          title: "Sweref 99 13 30",
          xtitle: "N",
          ytitle: "E",
          inverseAxis: true,
        },
        {
          code: "EPSG:3006",
          precision: "3",
          default: false,
          hint: "Sweref 99 TM",
          title: "Sweref 99 TM",
          xtitle: "N",
          ytitle: "E",
          inverseAxis: true,
        },
        {
          code: "EPSG:4326",
          precision: "3",
          default: false,
          hint: "WGS84",
          title: "WGS84",
          xtitle: "N",
          ytitle: "E",
          inverseAxis: true,
        },
      ],
      visibleAtStart: false,
      showFieldsOnStart: true,
      visibleForGroups: [],
    },
  },
  {
    type: "location",
    options: {
      target: "control",
      visibleAtStart: false,
      visibleForGroups: [],
    },
  },
  {
    type: "bookmarks",
    options: {
      target: "toolbar",
      height: "dynamic",
      instruction: "",
      visibleAtStart: false,
      visibleForGroups: [],
    },
  },
  {
    type: "layercomparer",
    options: {
      target: "toolbar",
      visibleForGroups: [],
    },
  },
  {
    type: "sketch",
    options: {
      target: "toolbar",
      position: "left",
      instruction: "",
      visibleAtStart: false,
      visibleForGroups: [],
    },
  },
];

const toolsOnMapsData = [
  {
    mapName: "default",
    toolId: 1,
    index: 1,
    options: {
      target: "control",
    },
  },
  {
    mapName: "default",
    toolId: 2,
    index: 2,
  },
  {
    mapName: "default",
    toolId: 3,
    index: 2,
  },
  {
    mapName: "secondary",
    toolId: 2,
    index: 1,
  },
];

async function main() {
  console.log(`Start seeding ...`);
  for (const u of projectionData) {
    const projection = await prisma.projection.create({
      data: { options: u },
    });
    console.log(`Created projection with id: ${projection.id}`);
  }

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

  for (const u of toolsOnMapsData) {
    const toolOnMap = await prisma.toolsOnMaps.create({
      data: u,
    });
    console.log(`Added tool to map with id ${toolOnMap.mapName}`);
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
