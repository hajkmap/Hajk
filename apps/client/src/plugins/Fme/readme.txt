To use this plugin you should add the following to the tools section in map_1.json.

The parameters for each product may be fetched from FME Server using:
https://fmeserver.varberg.se/fmerest/apidoc/v3/#!/repositories/parameters_get_32
Specify the repository and workspace and press "Try it out!"

{
  "type": "fme",
  "options": {
    "target": "toolbar",
    "instruction": "",
    "title": "Varbergs Geodatabank",
    "height": 805,
    "email":  "mattias.andren@zinet.se",
    "fmeServer": {
      "host": "https://fmeserver.varberg.se/",
      "repository": "Test_Utveckling",
      "token": "40832e0babd8906085649f28e1950e0f6b81b6ff"
    },
    "products": [
      {
        "id": "100",
        "type": "Geodata",
        "name": "Höjdinformation",
        "infoUrl": "https://localhost:64173/Content/Hojdinformation_produkt.pdf",
        "fmeWorkspace": "Hojdinformation_v1.fmw",
        "geoAttribute": "GEOMETRY",
        "maxArea": 200000,
        "visibleForGroups": [],
        "parameters": [
            {
              "defaultValue": "{\"type\":\"Polygon\",\"coordinates\":[[[164218.11998291014,6329758.880017089],[164580.9999999999,6329766.720196532],[164583.23996582025,6329681.600213622],[164220.3599487304,6329679.360162352],[164218.11998291014,6329758.880017089]]]}",
              "name": "GEOMETRY",
              "description": "geometry",
              "model": "string",
              "optional": true,
              "type": "TEXT"
            },
          {
            "featuregrouping": false,
            "listOptions": [
              {
                "caption": "Markhöjder (LAS)",
                "value": "LAS"
              },
              {
                "caption": "Höjdkurvor",
                "value": "HOJDKURVA"
              }
            ],
            "defaultValue": [
              "HOJDKURVA",
              "LAS"
            ],
            "name": "INFORMATION",
            "description": "Information",
            "model": "list",
            "optional": false,
            "type": "LOOKUP_LISTBOX"
          },
            {
              "featuregrouping": false,
              "listOptions": [
                {
                  "caption": "Oklassat",
                  "value": "0 1"
                },
                {
                  "caption": "Vatten",
                  "value": "9"
                },
                {
                  "caption": "Mark",
                  "value": "2"
                }
              ],
              "defaultValue": [
                "2"
              ],
              "name": "CLASSIFICATION",
              "description": "Punktklass",
              "model": "list",
              "optional": false,
              "type": "LOOKUP_LISTBOX"
            },
            {
              "listOptions": [
                {
                  "caption": "Esri Shape-fil",
                  "value": "SHP"
                },
                {
                  "caption": "AutoCAD DWG",
                  "value": "DWG"
                }
              ],
              "defaultValue": "SHP",
              "name": "OUTPUT_FORMAT",
              "description": "Utdataformat",
              "model": "string",
              "optional": false,
              "type": "LOOKUP_CHOICE"
            },
            {
              "listOptions": [
                {
                  "caption": "5 m",
                  "value": "5"
                },
                {
                  "caption": "10 m",
                  "value": "10"
                },
                {
                  "caption": "15 m",
                  "value": "15"
                },
                {
                  "caption": "20 m",
                  "value": "20"
                },
                {
                  "caption": "25 m",
                  "value": "25"
                },
                {
                  "caption": "50 m",
                  "value": "50"
                }
              ],
              "defaultValue": "10",
              "name": "Main_SPACING",
              "description": "Punktavstånd x/y (m)",
              "model": "string",
              "optional": false,
              "type": "LOOKUP_CHOICE"
            }
        ]
      },
      {
        "id": "101",
        "type": "Geodata",
        "name": "Ortofoto",
        "infoUrl": "https://localhost:64173/Content/Ortofoto_produkt.pdf",
        "fmeWorkspace": "Ortofoto_v1.fmw",
        "geoAttribute": "GEOMETRY",
        "maxArea": 600000,
        "visibleForGroups": [],
        "parameters": [
          {
            "defaultValue": "{\"type\":\"Polygon\",\"coordinates\":[[[162032.07858487076,6333564.636749576],[162811.87858487075,6333122.236749576],[162512.27858487074,6332703.636749576],[161928.47858487075,6333062.036749576],[162032.07858487076,6333564.636749576]]]}",
            "name": "GEOMETRY",
            "description": "geometry",
            "model": "string",
            "optional": true,
            "type": "TEXT"
          },
          {
            "listOptions": [
              {
                "caption": "2020 (0,08m)",
                "value": "2020"
              },
              {
                "caption": "2019 (0,16m)",
                "value": "2019"
              },
              {
                "caption": "2018 (0,08m)",
                "value": "2018"
              },
              {
                "caption": "2017 (0,25m)",
                "value": "2017"
              },
              {
                "caption": "2016 (0,08m)",
                "value": "2016"
              },
              {
                "caption": "2015 (0,25m)",
                "value": "2015"
              },
              {
                "caption": "2012 (0,1m)",
                "value": "2012"
              },
              {
                "caption": "2008 (0,2m)",
                "value": "2008"
              },
              {
                "caption": "2004 (0,4m)",
                "value": "2004"
              }
            ],
            "defaultValue": "2020",
            "name": "ORTOFOTO",
            "description": "Årtal (Max upplösning)",
            "model": "string",
            "optional": false,
            "type": "LOOKUP_CHOICE"
          },
          {
            "listOptions": [
              {
                "caption": "Max",
                "value": "MAX"
              },
              {
                "caption": "0,08m",
                "value": "008"
              },
              {
                "caption": "0,1m",
                "value": "010"
              },
              {
                "caption": "0,16m",
                "value": "016"
              },
              {
                "caption": "0,2m",
                "value": "020"
              },
              {
                "caption": "0,25m",
                "value": "025"
              },
              {
                "caption": "0,4m",
                "value": "040"
              },
              {
                "caption": "1m",
                "value": "100"
              }
            ],
            "defaultValue": "MAX",
            "name": "RESOLUTION",
            "description": "Välj Upplösning",
            "model": "string",
            "optional": false,
            "type": "LOOKUP_CHOICE"
          }
        ]
      },
      {
        "id": "102",
        "type": "Registerutdrag",
        "name": "Bygglov",
        "infoUrl": "https://localhost:64173/Content/Bygglov_produkt.pdf",
        "fmeWorkspace": "Bygglov_v1.fmw",
        "geoAttribute": "GEOMETRY",
        "maxArea": -1,
        "visibleForGroups": [],
        "parameters": [
          {
            "defaultValue": "{\"type\":\"Polygon\",\"coordinates\":[[[153900,6325700],[153900,6376100],[174300,6376100],[174300,6325700],[153900,6325700]]]}",
            "name": "GEOMETRY",
            "description": "Geometry",
            "model": "string",
            "optional": true,
            "type": "TEXT"
          },
          {
            "featuregrouping": false,
            "listOptions": [
              {
                "caption": "Avslutade",
                "value": "FINISHED"
              },
              {
                "caption": "Pågående",
                "value": "PRESENT"
              }
            ],
            "defaultValue": [
              "FINISHED",
              "PRESENT"
            ],
            "name": "AERENDE_STATUS",
            "description": "Status",
            "model": "list",
            "optional": false,
            "type": "LOOKUP_LISTBOX"
          }
        ]
      }
    ],
    "visibleForGroups": []
  },
  "index": 18
},


