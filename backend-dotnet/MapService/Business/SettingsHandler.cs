using Json.More;
using MapService.DataAccess;
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

        internal static void UpdateToolSettings(JsonObject toolSettings, string mapFileName)
        {
            JsonObject mapFile = JsonFileDataAccess.ReadMapFileAsJsonObject(mapFileName);

            try
            {                
                //Convert to JsonArray
                var tools = new JsonArray();
                toolSettings.Select(x => x.Value)
                            .ToList()
                            .ForEach(h => tools.Add(JsonNode.Parse(h.ToJsonString())));

                //Remove the layerswitcher node from the tools node
                var node = tools.FirstOrDefault(x => x["type"].ToString() == "layerswitcher");
                if(node != null) 
                {
                    tools.Remove(node);
                }
                
                //Add the layerswitcher node from file at Index = 0 to the tools node
                var layerswitcher = mapFile["tools"].AsArray()
                                                    .Where(x => x["type"].ToString() == "layerswitcher")
                                                    .FirstOrDefault();
                if (layerswitcher != null)
                {
                    tools.Insert(0, JsonNode.Parse(layerswitcher.ToJsonString()));
                }

                //Update the tools node in the file
                mapFile["tools"] = tools;

                JsonFileDataAccess.UpdateMapFile(mapFileName, mapFile);
            }
            catch (Exception ex)
            {
                throw new Exception("Could not update tool settings in the map configuration file.", ex);
            }
        }
    }
}