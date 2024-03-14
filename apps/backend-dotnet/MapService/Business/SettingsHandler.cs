using Json.Path;
using MapService.Business.MapConfig;
using MapService.DataAccess;
using MapService.Models;
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
                    if (tool["type"].ToString() == "layerswitcher")
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

        internal static void UpdateToolSettings(JsonArray tools, string mapFileName)
        {
            JsonObject mapFile = JsonFileDataAccess.ReadMapFileAsJsonObject(mapFileName);

            try
            {
                //Remove the layerswitcher node from the tools node
                var node = tools.FirstOrDefault(x => x["type"].ToString() == "layerswitcher");
                if (node != null)
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
                layerSettings["id"] = idValue;
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
                layerType = ConfigurationUtility.SetLayerTypeName(layerType);

                JsonArray? layers = layerFile[layerType]?.AsArray();

                //Layer type not found in layers database.
                if (layers == null)
                    throw new NullReferenceException();

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

        internal static void DeleteLayer(string layerType, string layerId)
        {
            //Adds the letter 's' to the end of the layer type name if necessary
            layerType = ConfigurationUtility.SetLayerTypeName(layerType);

            DeleteLayerFromLayerFile(layerType, layerId);
            DeleteLayerFromMapConfigFiles(layerId);
        }

        internal static void DeleteLayerFromLayerFile(string layerType, string layerId)
        {
            //Deleting from global layer file
            JsonObject layerFile = JsonFileDataAccess.ReadLayerFileAsJsonObject();
            try
            {                
                JsonArray? layers = layerFile[layerType]?.AsArray();

                //Layer with specified id for specified layer type has to exist in global layers store
                if (layers == null || layers.FirstOrDefault(x => x["id"].GetValue<string>() == layerId) == null)
                    throw new Exception("Layer with id " + layerId + " not found in " + layerType + " in global layers store");

                //New array should contain all existing layers without the one we will remove
                JsonArray newLayers = new JsonArray();
                foreach (JsonNode layer in layers)
                {
                    if (layer["id"].AsValue().ToString() != layerId)
                    {
                        newLayers.Add(JsonUtility.CloneJsonNodeFromJsonNode(layer));                       
                    }
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
                throw new Exception("Could not delete layer Id for " + layerType + " in the map configuration file.", ex);
            }
        }
      
        internal static void DeleteLayerFromMapConfigFiles(string layerId)
        {
            var mapConfigurationFiles = JsonFileDataAccess.GetMapConfigFiles();

            //Looking at all .json files except global layer file
            foreach (string mapConfigurationFile in mapConfigurationFiles)
            {
                JsonObject mapConfigurationObjects = JsonFileDataAccess.ReadMapFileAsJsonObject(mapConfigurationFile);
                var jsonDocument = JsonFileDataAccess.ReadMapFileAsJsonDocument(mapConfigurationFile);

                #region baselayers
                var input = "$.tools[?(@.type == 'layerswitcher')].options";
                var result = JsonPathUtility.GetJsonElement(jsonDocument, input);
                if (result == null)
                    continue;

                JsonElement baselayers = result.Value.GetProperty("baselayers");
                if (baselayers.ValueKind == JsonValueKind.Null)
                {
                    continue;
                }
                JsonArray baseLayerArray = CreateNewArrayOfLayersWithoutSpecifiedLayer(baselayers, layerId);
                JsonUtility.SetBaseLayersFromJsonObject(mapConfigurationObjects, baseLayerArray);
                #endregion

                #region layersingroups
                var inputGroups = "$.tools[?(@.type == 'layerswitcher')].options.groups";
                var resultGroups = JsonPathUtility.GetJsonElement(jsonDocument, inputGroups);
                if (resultGroups == null)
                    continue;

                foreach(JsonElement jsonElement in resultGroups.Value.EnumerateArray())
                {
                    JsonElement layersInGroup = jsonElement.GetProperty("layers");
                    JsonElement idOfGroup = jsonElement.GetProperty("id");
                    if (layersInGroup.ValueKind == JsonValueKind.Null)
                    {
                        continue;
                    }

                    JsonArray layerArray = CreateNewArrayOfLayersWithoutSpecifiedLayer(layersInGroup, layerId);
                    JsonUtility.SetLayersInGroupFromJsonObject(mapConfigurationObjects, layerArray, idOfGroup);
                }
                #endregion


                JsonFileDataAccess.UpdateMapFile(mapConfigurationFile, mapConfigurationObjects);
            }
        }

        public static JsonArray CreateNewArrayOfLayersWithoutSpecifiedLayer(JsonElement layers, string layerId)
        {
            var layersArray = JsonArray.Create(layers);

            JsonArray newLayers = new JsonArray();
            foreach (JsonNode layer in layersArray)
            {
                if (layer["id"].AsValue().ToString() != layerId)
                {
                    newLayers.Add(JsonUtility.CloneJsonNodeFromJsonNode(layer));
                }
            }

            layersArray?.Clear();
            foreach (JsonNode layer in newLayers)
            {
                layersArray?.Add(JsonUtility.CloneJsonNodeFromJsonNode(layer));
            }

            return layersArray;
        }       
    

        internal static int UpdateMapTool(string mapName, string toolName, JsonObject toolSettings)
        {
            JsonObject mapFile = JsonFileDataAccess.ReadMapFileAsJsonObject(mapName);

            int statusCode = StatusCodes.Status500InternalServerError;

            try
            {
                var tools = mapFile["tools"].AsArray();

                if (tools == null) { return statusCode; }

                var existingTool = tools.Where(x => x["type"].ToString().ToLower() == toolName.ToLower()).FirstOrDefault();

                if (existingTool == null)
                {
                    var mapTool = new ToolSetting
                    {
                        type = toolName,
                        index = 0,
                        options = toolSettings
                    };

                    tools.Add(mapTool);

                    statusCode = StatusCodes.Status201Created;
                }
                else
                {
                    int index = tools.IndexOf(existingTool);
                    tools[index]["options"] = toolSettings;

                    statusCode = StatusCodes.Status204NoContent;
                }

                mapFile["tools"] = tools;

                JsonFileDataAccess.UpdateMapFile(mapName, mapFile);

                return statusCode;
            }
            catch (Exception ex)
            {
                throw new Exception("Could not update map tool in the map configuration file.", ex);
            }
        }
    }
}