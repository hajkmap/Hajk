using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace MapService.Controllers
{
    public static class ControllerUtility
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
        /// <param name="jsonObject">An json object</param>
        /// <returns>Returns a Json Object</returns>
        public static T ConvertToJsonObject<T>(JsonObject jsonObject)
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
    }
}
