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
    }
}