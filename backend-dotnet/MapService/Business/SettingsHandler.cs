using Json.More;
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

        internal static void UpdateLayerType(string layerType, JsonObject layerSettings)
        {
            //If id for layer is null then we generate a new one, otherwise we take it
            string idValue = String.Empty;
            JsonValue? id = layerSettings["id"]?.AsValue();
            if (id == null)
            {
                idValue = GenerateLayerId();
                layerSettings.Add(new KeyValuePair<string, JsonNode?>("id", idValue));
            }
            else
            {
                idValue = id.ToString();
            }
            var newIdValue = new { id = idValue };
            JsonObject? newLayer = JsonUtility.ConvertToJsonObject(newIdValue);

            JsonObject? layerSettingsObject = JsonUtility.ConvertToJsonObject(layerSettings);
            var enumerator = layerSettingsObject.GetEnumerator();
            while (enumerator.MoveNext())
            {
                var item = enumerator.Current;

                if (item.Key == "id")
                    continue;

                newLayer?.Add(item.Key, JsonUtility.CloneJsonNodeFromJsonNode(item.Value));
            }

            JsonObject layerFile = JsonFileDataAccess.ReadLayerFileAsJsonObject();
            try
            {
                //If layer is e.g. wmslayer then we add 's' to the end
                if (layerType.Last() != 's')
                    layerType = layerType + "s";
                JsonArray? layers = layerFile[layerType]?.AsArray();

                //Layer type not found in layers database.
                if (layers == null)
                    return;

                //If we take the newly generated id, we put that id-value first in the array
                JsonArray newLayers = new JsonArray();
                Boolean newLayerIsAdded = false;
                foreach (JsonNode layer in layers)
                {
                    if (layer["id"].AsValue().ToString() != idValue)
                    {
                        newLayers.Add(JsonUtility.CloneJsonNodeFromJsonNode(layer));
                    }
                    else
                    {
                        newLayers.Add(newLayer);
                        newLayerIsAdded = true;
                    }
                }
                if (id == null || (!newLayerIsAdded && !layers.Contains(idValue)))
                {
                    newLayers.Add(newLayer);
                }

                JsonArray? layerTypes = layerFile[layerType]?.AsArray();
                layerTypes?.Clear();
                foreach (JsonNode layer in newLayers)
                {
                    layerTypes?.Add(JsonUtility.CloneJsonNodeFromJsonNode(layer));
                }

                JsonFileDataAccess.UpdateLayerFile(layerFile);
            }
            catch (Exception ex)
            {
                throw new Exception("Could not update map settings in the map configuration file.", ex);
            }

        }

        internal static string GenerateLayerId()
        {
            Random res = new Random();

            // String that contain both alphabets and numbers
            String str = "abcdefghijklmnopqrstuvwxyz0123456789";
            int size = 6;

            // Initializing the empty string
            String randomstring = "";

            for (int i = 0; i < size; i++)
            {

                // Selecting a index randomly
                int x = res.Next(str.Length);

                // Appending the character at the 
                // index to the random alphanumeric string.
                randomstring = randomstring + str[x];
            }

            return randomstring;
        }
    }
}