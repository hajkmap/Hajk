using Json.Path;
using MapService.DataAccess;
using MapService.Models;
using MapService.Utility;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace MapService.Business.MapConfig
{
    /// <summary>
    /// Business logic for map config endpoints
    /// </summary>
    internal static class MapConfigHandler
    {
        /// <summary>
        /// Gets a layer from layers file
        /// </summary>
        /// <returns>Returns all layers as a JsonObject.</returns>
        internal static JsonDocument GetLayersAsJsonDocument()
        {
            return JsonFileDataAccess.ReadLayerFileAsJsonDocument();
        }

        /// <summary>
        /// Gets a layer from layers file
        /// </summary>
        /// <returns>Returns all layers as a JsonObject.</returns>
        internal static JsonObject GetLayersAsJsonObject()
        {
            return JsonFileDataAccess.ReadLayerFileAsJsonObject();
        }

        /// <summary>
        /// Gets a map as a JsonObject.
        /// </summary>
        /// <param name="mapFileName">The name of the map including the file ending. </param>
        /// <returns>Returns a map as a JsonObject.</returns>
        internal static JsonObject GetMapAsJsonObject(string mapFileName)
        {
            return JsonFileDataAccess.ReadMapFileAsJsonObject(mapFileName);
        }

        /// <summary>
        /// Gets a map as a JsonDocument.
        /// </summary>
        /// <param name="mapFileName">The name of the map including the file ending. </param>
        /// <returns>Returns a map as a JsonDocument.</returns>
        internal static JsonDocument GetMapAsJsonDocument(string mapFileName)
        {
            return JsonFileDataAccess.ReadMapFileAsJsonDocument(mapFileName); ;
        }

        /// <summary>
        /// Gets all maps names.
        /// </summary>
        /// <returns>Return all map names.</returns>
        internal static IEnumerable<string> GetMaps()
        {
            var mapConfigurationFiles = JsonFileDataAccess.GetMapConfigFiles();
            var mapConfigurationNames = new List<string>();
            foreach (string mapConfigurationFile in mapConfigurationFiles)
            {
                mapConfigurationNames.Add(Path.GetFileNameWithoutExtension(mapConfigurationFile));
            }

            return mapConfigurationNames;
                
        }

        /// <summary>
        /// Duplicates the map configuration.
        /// </summary>
        /// <param name="mapFileNameFrom">The name of the map including the file ending to be duplicated. </param>
        /// <param name="mapFileNameTo">The name of the new map (the duplicate) including the file ending. </param>
        internal static void DuplicateMap(string mapFileNameFrom, string mapFileNameTo)
        {
            JsonFileDataAccess.DuplicateMapFile(mapFileNameFrom, mapFileNameTo);
        }

        /// <summary>
        /// Deletes the map configuration.
        /// </summary>
        /// <param name="mapFileName">The name of the map including the file ending. </param>
        internal static void DeleteMap(string mapFileName)
        {
            JsonFileDataAccess.DeleteMapFile(mapFileName);
        }

        /// <summary>
        /// Returns names of all image files in a folder
        /// </summary>
        /// <returns>Collection of image file names</returns>
        internal static IEnumerable<string> GetListOfImages()
        {
            string mediaPath = GetMediaPath("Informative:Image:Path");
            IEnumerable<string> allowedExtentions = GetAllowedExtensions("Informative:Image:Extensions");

            return GetMediaFiles(mediaPath, allowedExtentions);
        }

        /// <summary>
        /// Returns names of all video files in a folder
        /// </summary>
        /// <returns>Collection of video file names</returns>
        internal static IEnumerable<string> GetListOfVideos()
        {
            string mediaPath = GetMediaPath("Informative:Video:Path");
            IEnumerable<string> allowedExtentions = GetAllowedExtensions("Informative:Video:Extensions");

            return GetMediaFiles(mediaPath, allowedExtentions);
        }

        /// <summary>
        /// Returns names of all audio files in a folder
        /// </summary>
        /// <returns>Collection of audio file names</returns>
        internal static IEnumerable<string> GetListOfAudioFiles()
        {
            string mediaPath = GetMediaPath("Informative:Audio:Path");
            IEnumerable<string> allowedExtentions = GetAllowedExtensions("Informative:Audio:Extensions");

            return GetMediaFiles(mediaPath, allowedExtentions);
        }

        private static string GetMediaPath(string pathInConfiguration)
        {
            return PathUtility.GetPath(pathInConfiguration);
        }

        private static IEnumerable<string> GetAllowedExtensions(string sectionKeyPath)
        {
            return ConfigurationUtility.GetSectionArray(sectionKeyPath);
        }

        private static IEnumerable<string> GetMediaFiles(string mediaPath, IEnumerable<string> allowedExtentions)
        {
            return FileUtility.GetFiles(mediaPath, allowedExtentions);
        }

        internal static JsonObject ExportMapWithFormat(string map, string format)
        {
            if (format != "json")
                throw new FormatException();

            JsonElement jsonElementLayers;
            JsonElement jsonElementMaps;
            try
            {
                jsonElementLayers = GetLayersAsJsonDocument().RootElement;
                jsonElementMaps = GetMapAsJsonDocument(map).RootElement;
            }
            catch (Exception)
            {
                throw;
            }

            var layerExportItems = FilterLayers(jsonElementLayers);
            JsonObject? jsonObjectLayerExportItems = JsonUtility.ConvertToJsonObject(layerExportItems.layers);
            if (map == "layers" || map == JsonFileDataAccess.LAYER_FILE)
            {
                if (jsonObjectLayerExportItems == null)
                    throw new NullReferenceException();

                return jsonObjectLayerExportItems;
            }

            JsonObject? jsonObjectMapExportItems = FilterMaps(jsonElementMaps, layerExportItems);
            if (jsonObjectMapExportItems == null)
                throw new NullReferenceException();

            return jsonObjectMapExportItems;
        }

        internal static void CreateMapConfiguration(string name)
        {
            var appDataFolder = PathUtility.GetPath("DataContent:Path");
            var templatesFolder = PathUtility.GetPath("Templates:Path");
            var templateFileName = ConfigurationUtility.GetSectionItem("Templates:Name");

            File.Copy(
                Path.Combine(templatesFolder, templateFileName),
                Path.Combine(appDataFolder, GetNewFileNameWithExtension(name))
            );
        }

        private static string GetNewFileNameWithExtension(string filename)
        {
            if (filename.EndsWith(".json"))
                return filename;

            return filename + ".json";
        }

        private static LayerExportItem FilterLayers(JsonElement jsonElementLayers)
        {
            var layerExportItem = new LayerExportItem();

            var input = "$[*][*]";
            var result = JsonPathUtility.GetJsonArray(jsonElementLayers, input);

            if (result == null)
                return layerExportItem;

            foreach (PathMatch path in result)
            {
                if (!path.Value.TryGetProperty("caption", out JsonElement name) && name.GetString() == null)
                    continue;

                if (!path.Value.TryGetProperty("id", out JsonElement id) && id.GetString() == null)
                    continue;

                if (!path.Value.TryGetProperty("layers", out JsonElement layers))
                {
                    layerExportItem.layers.Add(id.GetString(),
                                               new LayerExportItem.LayerExportBaseItem(name.GetString(), null));
                    continue;
                }

                var subLayers = new List<string>();

                foreach (JsonElement subLayer in layers.EnumerateArray())
                {
                    if (subLayer.GetString() == null)
                        continue;

                    subLayers.Add(subLayer.GetString());
                }

                layerExportItem.layers.Add(id.GetString(),
                    new LayerExportItem.LayerExportBaseItem(name.GetString(), subLayers));
            }

            return layerExportItem;
        }

        private static JsonObject? FilterMaps(JsonElement jsonElementMaps, LayerExportItem layerExportItems)
        {
            var baseLayers = new List<MapExportItem.BaseLayerExportItem>();
            var groups = new List<MapExportItem.GroupExportItem>();

            var input = "$.tools[?(@.type == 'layerswitcher')].options";
            var result = JsonPathUtility.GetJsonElement(jsonElementMaps, input);
            if (result == null)
                return null;

            if (!result.Value.TryGetProperty("baselayers", out JsonElement baselayers))
                return null;

            var baseLayerIds = GetArrayValues(baselayers, "id");

            foreach (string baseLayerId in baseLayerIds)
            {
                string? name = layerExportItems.layers[baseLayerId].name;
                List<string> sublayers = layerExportItems.layers[baseLayerId].subLayers;
                baseLayers.Add(new MapExportItem.BaseLayerExportItem(name, sublayers));
            }

            JsonElement groupsNode;
            if (!result.Value.TryGetProperty("groups", out groupsNode))
                return null;

            foreach (JsonElement element in groupsNode.EnumerateArray())
            {
                if (!element.TryGetProperty("name", out JsonElement name) && name.GetString() == null)
                    continue;

                if (!element.TryGetProperty("layers", out JsonElement groupLayers) && groupLayers.GetString() == null)
                    continue;

                List<MapExportItem.GroupExportItem.GroupLayerExportItem> layersInGroup =
                    new List<MapExportItem.GroupExportItem.GroupLayerExportItem>();

                List<string> Ids = GetArrayValues(groupLayers, "id");
                foreach (string id in Ids)
                {
                    LayerExportItem.LayerExportBaseItem layerExportItem = layerExportItems.layers[id];
                    MapExportItem.GroupExportItem.GroupLayerExportItem groupLayerExportItem =
                        new MapExportItem.GroupExportItem.GroupLayerExportItem(layerExportItem);

                    layersInGroup.Add(groupLayerExportItem);
                }
                groups.Add(new MapExportItem.GroupExportItem(name.GetString(), layersInGroup));
                Ids.Clear();
            }

            MapExportItem mapExportItem = new MapExportItem(baseLayers, groups);
            return JsonUtility.ConvertToJsonObject(mapExportItem);
        }

        private static List<string> GetArrayValues(JsonElement array, string proptertyName)
        {
            List<string> values = new List<string>();
            foreach (JsonElement element in array.EnumerateArray())
            {
                JsonElement item;
                if (!element.TryGetProperty(proptertyName, out item) && item.GetString() == null)
                    continue;

                values.Add(item.GetString());
            }

            return values;
        }
    }
}