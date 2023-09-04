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
        /// Serialize an anonymous object as a json string and then Deserialize the json string as an Json Array.
        /// </summary>
        /// <param name="anonymousObject">An anonomys object</param>
        /// <returns>Returns a Json Array</returns>
        public static JsonArray? ConvertToJsonArray(dynamic anonymousObject)
        {
            var jsonOptions = new JsonSerializerOptions()
            {
                WriteIndented = true,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            };
            string serializedJson = JsonSerializer.Serialize(anonymousObject, jsonOptions);
            JsonArray? deserializedJson;
            try
            {
                deserializedJson = JsonSerializer.Deserialize<JsonArray>(serializedJson);
            }
            catch (Exception)
            {
                throw;
            }

            return deserializedJson;
        }

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
            JsonArray? toolsArray = jsonObject["tools"]?.AsArray();

            if (toolsArray == null) { return; }

            foreach (var toolObject in toolsArray.OfType<JsonObject>())
            {
                if (toolObject?["type"]?.ToString() == "layerswitcher")
                {
                    var options = toolObject?["options"];
                    var groups = options?["groups"];

                    var jsonArrayGroups = groups?.AsArray();

                    if (jsonArrayGroups != null)
                    {
                        foreach (var jsonObjectInArray in jsonArrayGroups.OfType<JsonObject>())
                        {
                            UpdateLayersInGroups(jsonObjectInArray, groupId.ToString(), jsonArray);
                        }
                    }
                }
            }
        }

        public static void UpdateLayersInGroups(JsonObject json, string targetGroupId, JsonArray newLayers)
        {
            if (json == null || json["id"]?.ToString() != targetGroupId)
            {
                if (json?.ContainsKey("groups") == true)
                {
                    JsonArray? groupsArray = json["groups"]?.AsArray();

                    if (groupsArray == null) { return; }

                    foreach (var group in groupsArray.OfType<JsonObject>())
                    {
                        UpdateLayersInGroups(group, targetGroupId, newLayers);
                    }
                }
                return;
            }

            json["layers"]?.AsArray().Clear();
            json["layers"] = newLayers;
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
                if (visibleForGroups == null || visibleForGroups.Count == 0)
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