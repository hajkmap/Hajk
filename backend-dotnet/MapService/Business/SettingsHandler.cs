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
    }
}