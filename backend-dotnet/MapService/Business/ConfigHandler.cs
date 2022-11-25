using MapService.DataAccess;
using MapService.Models;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace MapService.Business.Config
{
    /// <summary>
    /// Business logic for config endpoints
    /// </summary>
    public static class ConfigHandler
    {
        /// <summary>
        /// Filter and returns returns user specific maps
        /// </summary>
        /// <returns>Collection of UserSpecificMaps</returns>
        public static IEnumerable<UserSpecificMaps> GetUserSpecificMaps()
        {
            var mapConfigurationFiles = JsonFileDataAccess.GetMapConfigFiles();

            var mapConfigurationsList = new List<UserSpecificMaps>();

            foreach (string mapConfigurationFile in mapConfigurationFiles)
            {
                var mapConfiguration = JsonFileDataAccess.ReadMapFileAsJsonDocument(mapConfigurationFile);

                if (!HasActiveDropDownThemeMap(mapConfiguration))
                    continue;

                string mapConfigurationName = Path.GetFileNameWithoutExtension(mapConfigurationFile);
                string mapConfigurationTitle = JsonUtility.GetPropertyValueFromJsonObjectAsString(GetMapfromMapConfiguration(mapConfiguration), "title");

                var userSpecificMap = new UserSpecificMaps
                {
                    mapConfigurationTitle = mapConfigurationTitle,
                    mapConfigurationName = mapConfigurationName
                };

                mapConfigurationsList.Add(userSpecificMap);
            }

            return mapConfigurationsList;
        }

        private static bool HasActiveDropDownThemeMap(JsonDocument mapConfiguration)
        {
            var input = "$.tools[?(@.type == 'layerswitcher')].options.dropdownThemeMaps";
            var result = JsonPathUtility.GetJsonElement(mapConfiguration, input);

            if (result == null) { return false; }

            return result.Value.GetBoolean();
        }

        private static JsonObject? GetMapfromMapConfiguration(JsonDocument mapConfiguration)
        {
            var input = "$.map";
            var result = JsonPathUtility.GetJsonElement(mapConfiguration, input);

            if (result == null) { return null; }

            return JsonSerializer.Deserialize<JsonObject>(result.Value.GetRawText());
        }
    }
}