using MapService.DataAccess;
using MapService.Models;
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
                var mapConfiguration = JsonFileDataAccess.ReadMapFile(mapConfigurationFile);

                if (!HasActiveDropDownThemeMap(mapConfiguration))
                    continue;

                string mapConfigurationName = Path.GetFileNameWithoutExtension(mapConfigurationFile);
                string mapConfigurationTitle = GetPropertyValueFromJsonObject(GetMapfromMapConfiguration(mapConfiguration), "title");

                var userSpecificMap = new UserSpecificMaps
                {
                    mapConfigurationTitle = mapConfigurationTitle,
                    mapConfigurationName = mapConfigurationName
                };

                mapConfigurationsList.Add(userSpecificMap);
            }

            return mapConfigurationsList;
        }

        private static bool HasActiveDropDownThemeMap(JsonObject mapConfiguration)
        {
            var layerSwitcher = GetToolFromMapConfiguration(mapConfiguration, "layerswitcher");

            if (layerSwitcher == null) { return false; }

            var optionsJsonNode = GetNodeFromJsonObject(layerSwitcher, "options") as JsonObject;

            var dropdownThemeMapsNodeValue = GetPropertyValueFromJsonObject(optionsJsonNode, "dropdownThemeMaps");

            bool.TryParse(dropdownThemeMapsNodeValue.ToString(), out var result);

            return result;
        }

        private static string GetPropertyValueFromJsonObject(JsonObject? jsonObject, string propertyName)
        {
            if (jsonObject == null) { return string.Empty; }

            jsonObject.TryGetPropertyValue(propertyName, out var nodeValue);

            if (nodeValue == null) { return string.Empty; }

            return nodeValue.ToString();
        }

        private static JsonNode? GetNodeFromJsonObject(JsonObject? jsonObject, string nodeName)
        {
            if (jsonObject == null) { return null; }

            var jsonNode = jsonObject[nodeName];

            return jsonNode;
        }

        private static JsonObject? GetMapfromMapConfiguration(JsonObject mapConfiguration)
        {
            if (mapConfiguration == null) { return null; }

            var mapJsonObject = mapConfiguration["map"] as JsonObject;

            if (mapJsonObject == null) { return null; }

            return mapJsonObject;
        }

        private static JsonObject? GetToolFromMapConfiguration(JsonObject mapConfiguration, string toolName)
        {
            var toolsJsonNode = GetNodeFromJsonObject(mapConfiguration, "tools");

            if (toolsJsonNode == null) { return null; }

            var toolsArray = toolsJsonNode.AsArray();

            foreach (var tool in toolsArray)
            {
                if (tool is not JsonObject toolJsonObject) { continue; }

                toolJsonObject.TryGetPropertyValue("type", out var toolTypeNodeValue);

                if (toolTypeNodeValue == null) { continue; }

                if (toolTypeNodeValue.ToString() == toolName)
                {
                    return toolJsonObject;
                }
            }

            return null;
        }
    }
}