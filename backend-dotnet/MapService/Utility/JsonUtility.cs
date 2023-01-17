using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace MapService.Utility
{
    /// <summary>
    /// Json utility class
    /// </summary>
    public static class JsonUtility
    {
        /// <summary>
        /// Serialize an anonymous object as a json string and then Deserialize the json string as an Json Object.
        /// </summary>
        /// <param name="anonymousObject">An anonomys object</param>
        /// <returns>Returns a Json Object</returns>
        public static JsonObject? ConvertToJsonObject(dynamic anonymousObject)
        {
            var jsonOptions = new JsonSerializerOptions()
            {
                WriteIndented = true,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            };
            string serializedJson = JsonSerializer.Serialize(anonymousObject, jsonOptions);
            JsonObject? deserializedJson;
            try
            {
                deserializedJson = JsonSerializer.Deserialize<JsonObject>(serializedJson);
            }
            catch (Exception)
            {
                throw;
            }

            return deserializedJson;
        }

        /// <summary>
        /// Serialize an json object as a json string and then Deserialize the json string as an Json Object.
        /// </summary>
        /// <param name="jsonObject">A json object</param>
        /// <returns>Returns a Json Object</returns>
        public static T ConvertFromJsonObject<T>(JsonObject jsonObject)
        {
            var jsonOptions = new JsonSerializerOptions()
            {
                WriteIndented = true,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            };
            string serializedJson = JsonSerializer.Serialize(jsonObject, jsonOptions);
            T deserializedObject;
            try
            {
                deserializedObject = JsonSerializer.Deserialize<T>(serializedJson);
            }
            catch (Exception)
            {
                throw;
            }

            return deserializedObject;
        }

        /// <summary>
        /// Get property value from JsonObject as a string
        /// </summary>
        /// <param name="jsonObject">A json object</param>
        /// <param name="propertyName">The name of the property</param>
        /// <returns>The value of the property as a string</returns>
        public static string GetPropertyValueFromJsonObjectAsString(JsonObject? jsonObject, string propertyName)
        {
            if (jsonObject == null) { return string.Empty; }

            jsonObject.TryGetPropertyValue(propertyName, out var nodeValue);

            if (nodeValue == null) { return string.Empty; }

            return nodeValue.ToString();
        }

        /// <summary>
        /// Get a Json Node from JsonObject
        /// </summary>
        /// <param name="jsonObject">A json object</param>
        /// <param name="nodeName">The name of the node</param>
        /// <returns>The json node</returns>
        public static JsonNode? GetJsonNodeFromJsonObject(JsonObject? jsonObject, string nodeName)
        {
            if (jsonObject == null) { return null; }

            var jsonNode = jsonObject[nodeName];

            return jsonNode;
        }

        /// <summary>
        /// Clone a Json Node from JsonNode
        /// </summary>
        /// <param name="jsonNode">A json node</param>
        /// <returns>The json node</returns>
        public static JsonNode? CloneJsonNodeFromJsonNode(JsonNode? jsonNode)
        {
            if (jsonNode == null) { return null; }

            var clonedJsonNode = jsonNode.Deserialize<JsonNode?>();

            return clonedJsonNode;
        }

        /// <summary>
        /// Clone a Json Array from JsonArray
        /// </summary>
        /// <param name="jsonArray">A json array</param>
        /// <returns>The json array</returns>
        public static JsonArray? CloneJsonArrayFromJsonArray(JsonArray? jsonArray)
        {
            if (jsonArray == null) { return null; }

            var clonedJsonArray = jsonArray.Deserialize<JsonArray?>();

            return clonedJsonArray;
        }

        public static void SetBaseLayersFromJsonObject(JsonObject jsonObject, JsonArray jsonArray)
        {
            JsonArray tools = jsonObject["tools"]?.AsArray();

            foreach (JsonObject tool in tools)
            {
                if (tool["type"].ToString() == "layerswitcher")
                {
                    tool["options"]["baselayers"].AsArray().Clear();
                    tool["options"]["baselayers"] = jsonArray;
                    break;
                }
            }
        }

        public static void SetLayersInGroupFromJsonObject(JsonObject jsonObject, JsonArray jsonArray, JsonElement groupId)
        {
            JsonArray tools = jsonObject["tools"]?.AsArray();
            foreach (JsonObject tool in tools)
            {
                if (tool["type"].ToString() == "layerswitcher")
                {
                    JsonArray jsonArrayGroups = tool["options"]["groups"].AsArray();
                    foreach (JsonObject jsonObjectInArray in jsonArrayGroups)
                    {
                        //Looping through all the groups, the code only runs when we work with a group for the first time(new group-id)
                        if (groupId.ToString() == jsonObjectInArray["id"].ToString())
                        {
                            jsonObjectInArray["layers"].AsArray().Clear();
                            jsonObjectInArray["layers"] = jsonArray;
                            break;
                        }
                    }

                }
            }
        }

        public static JsonArray FilterLayers(IEnumerable<string>? adUserGroups, JsonElement layers)
        {
            var layersArray = JsonArray.Create(layers);

            var filteredLayers = CloneJsonArrayFromJsonArray(layersArray);
            filteredLayers.Clear();

            foreach (var layerArray in layersArray)
            {
                var visibleForGroups = layerArray["visibleForGroups"]?.AsArray();

                //If visibleForGroups is null returns it
                if (visibleForGroups.Count == 0)
                {
                    JsonNode jsonNodeClone = CloneJsonNodeFromJsonNode(layerArray);
                    filteredLayers.Add(jsonNodeClone);
                    continue;
                }

                foreach (var visibleForGroup in visibleForGroups)
                {
                    string group = visibleForGroup.GetValue<string>();
                    if (adUserGroups.Contains(group))
                    {
                        JsonNode jsonNodeClone = CloneJsonNodeFromJsonNode(layerArray);
                        filteredLayers.Add(jsonNodeClone);
                    }
                }
            }

            return filteredLayers;
        }

    }
}