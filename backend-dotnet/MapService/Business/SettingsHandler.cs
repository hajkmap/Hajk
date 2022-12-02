using MapService.DataAccess;
using MapService.Utility;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace MapService.Business.Settings
{
    public static class SettingsHandler
    {
        internal static void UpdateMapSettings(string mapFileName, JsonObject mapSettings)
        {
            JsonObject mapFile = JsonFileDataAccess.ReadMapFileAsJsonObject(mapFileName);

            try
            {
                mapFile.Remove("map");
                mapFile.Add("map", mapSettings);

                JsonFileDataAccess.UpdateMapFile(mapFileName, mapFile);
            }
            catch (Exception ex)
            {
                throw new Exception("Could not update map settings in the map configuration file.", ex);
            }
        }

        internal static void UpdateLayerMenu(string mapFileName, JsonObject layerMenu)
        {
            JsonObject mapFile = JsonFileDataAccess.ReadMapFileAsJsonObject(mapFileName);
            try
            {
                JsonArray tools = mapFile["tools"]?.AsArray();
               
                foreach (JsonObject tool in tools)
                {
                    if(tool["type"].ToString() == "layerswitcher")
                    {
                        tool.Remove("options");
                        tool.Add("options", layerMenu);
                        JsonFileDataAccess.UpdateMapFile(mapFileName, mapFile);
                        return;
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception("Could not update map settings in the map configuration file.", ex);
            }
        }

        internal static void CreateLayerType(string layerType, JsonObject layerSettings)
        {
            if(layerType.Last() != 's')
                layerType = layerType + "s";

            JsonObject layersFile = JsonFileDataAccess.ReadLayerFileAsJsonObject();

            JsonArray? layers = layersFile[layerType]?.AsArray();
            if (layers == null)
                throw new Exception("Layer type " + layerType +  " not found in layers database.");

            layers.Add(layerSettings);

            JsonFileDataAccess.UpdateMapFile(JsonFileDataAccess.LAYER_FILE, layersFile);
        }

        internal static void UpdateLayerType(string layerType, JsonObject layerSettings)
        {
            if (layerType.Last() != 's')
                layerType = layerType + "s";

            JsonObject layersFile = JsonFileDataAccess.ReadLayerFileAsJsonObject();

            JsonArray? layers = layersFile[layerType]?.AsArray();
            if (layers == null)
                throw new Exception("Layer type " + layerType + " not found in layers database.");
            
            foreach(JsonObject layer in layers)
            {
                string id = layer["id"].ToString();
            }

            layers.Remove(layerSettings);
            layers.Add(layerSettings);

            JsonFileDataAccess.UpdateMapFile(JsonFileDataAccess.LAYER_FILE, layersFile);
        }
    }
}