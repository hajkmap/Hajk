using Json.Path;
using MapService.DataAccess;
using MapService.Models;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace MapService.Business.Config
{
    public static class ConfigHandler
    {
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
                string mapConfigurationTitle = HandlerUtility.GetPropertyValueFromJsonObjectAsString(GetMapfromMapConfiguration(mapConfiguration), "title");

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
            var path = JsonPath.Parse(input);

            var result = path.Evaluate(mapConfiguration.RootElement);

            if (result.Error != null || result.Matches == null || result.Matches.Count != 1) { return false; }

            return result.Matches[0].Value.GetBoolean();
        }

        private static JsonObject? GetMapfromMapConfiguration(JsonDocument mapConfiguration)
        {
            var input = "$.map";
            var path = JsonPath.Parse(input);

            var result = path.Evaluate(mapConfiguration.RootElement);

            if (result.Error != null || result.Matches == null || result.Matches.Count != 1) { return null; }

            var mapJsonObject = JsonSerializer.Deserialize<JsonObject>(result.Matches[0].Value.GetRawText());

            return mapJsonObject;
        }
    }
}