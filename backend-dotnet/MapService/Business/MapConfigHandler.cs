using Json.Path;
using MapService.DataAccess;
using MapService.Models;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace MapService.Business.MapConfig
{
    /// <summary>
    /// Business logic for map config endpoints
    /// </summary>
    public static class MapConfigHandler
    {
        /// <summary>
        /// Gets a layer from layers file
        /// </summary>
        /// <returns>Returns all layers as a JsonObject.</returns>
        public static JsonDocument GetLayersAsJsonDocument()
        {
            return JsonFileDataAccess.ReadLayerFileAsJsonDocument();
        }

        /// <summary>
        /// Gets a layer from layers file
        /// </summary>
        /// <returns>Returns all layers as a JsonObject.</returns>
        public static JsonObject GetLayersAsJsonObject()
        {
            return JsonFileDataAccess.ReadLayerFileAsJsonObject();
        }

        /// <summary>
        /// Gets a map as a JsonObject.
        /// </summary>
        /// <param name="mapFileName">The name of the map including the file ending. </param>
        /// <returns>Returns a map as a JsonObject.</returns>
        public static JsonObject GetMapAsJsonObject(string mapFileName)
        {
            return JsonFileDataAccess.ReadMapFileAsJsonObject(mapFileName);
        }

        public static JsonDocument GetMapAsJsonDocument(string mapFileName)
        {
            return JsonFileDataAccess.ReadMapFileAsJsonDocument(mapFileName); ;
        }

        /// <summary>
        /// Deletes the map configuration.
        /// </summary>
        /// <param name="mapFileName">The name of the map including the file ending. </param>
        public static void DeleteMap(string mapFileName)
        {
            JsonFileDataAccess.DeleteMapFile(mapFileName);
        }

        /// <summary>
        /// Gets all maps names.
        /// </summary>
        /// <returns>Return all map names.</returns>
        public static IEnumerable<string> GetMaps()
        {
            return JsonFileDataAccess.GetMapConfigFiles();
        }

        /// <summary>
        /// Returns names of all image files in a folder
        /// </summary>
        /// <returns>Collection of image file names</returns>
        public static IEnumerable<string> GetListOfImages()
        {
            string mediaPath = GetMediaPath("Media:Image:Path");
            IEnumerable<string> allowedExtentions = GetAllowedExtensions("Media:Image:AllowedExtentions");

            return GetMediaFiles(mediaPath, allowedExtentions);
        }

        /// <summary>
        /// Returns names of all video files in a folder
        /// </summary>
        /// <returns>Collection of video file names</returns>
        public static IEnumerable<string> GetListOfVideos()
        {
            string mediaPath = GetMediaPath("Media:Video:Path");
            IEnumerable<string> allowedExtentions = GetAllowedExtensions("Media:Video:AllowedExtentions");

            return GetMediaFiles(mediaPath, allowedExtentions);
        }

        /// <summary>
        /// Returns names of all audio files in a folder
        /// </summary>
        /// <returns>Collection of audio file names</returns>
        public static IEnumerable<string> GetListOfAudioFiles()
        {
            string mediaPath = GetMediaPath("Media:Audio:Path");
            IEnumerable<string> allowedExtentions = GetAllowedExtensions("Media:Audio:AllowedExtentions");

            return GetMediaFiles(mediaPath, allowedExtentions);
        }

        private static IConfiguration GetConfiguration()
        {
            object? configurationObject = AppDomain.CurrentDomain.GetData("Configuration");
            if (configurationObject == null)
                throw new Exception();

            if (!(configurationObject is IConfiguration))
                throw new Exception();

            return configurationObject as IConfiguration;
        }

        private static string GetMediaPath(string configurationPath)
        {
            IConfiguration configuration = GetConfiguration();
            string? mediaUploadPath = configuration.GetSection(configurationPath).Value;

            var folderPath = string.Empty;
            Uri? pathAbsolut = GetUriPath(mediaUploadPath, UriKind.Absolute);
            if (pathAbsolut != null)
                folderPath = pathAbsolut.AbsolutePath;

            Uri? pathRelative = GetUriPath(mediaUploadPath, UriKind.Relative);
            if (pathRelative != null)
            {
                object? configurationObject = AppDomain.CurrentDomain.GetData("ContentRootPath");
                if (configurationObject == null)
                    throw new Exception();

                if (!(configurationObject is string))
                    throw new Exception();

                var contentRootPath = configurationObject as string;
                folderPath = Path.GetFullPath(
                    Path.Combine(Path.GetDirectoryName(contentRootPath), pathRelative.OriginalString));
            }

            return folderPath;
        }

        private static Uri? GetUriPath(string? mediaUploadPath, UriKind kindOfUri)
        {
            Uri? path;
            Uri.TryCreate(mediaUploadPath, kindOfUri, out path);
            return path;
        }

        private static IEnumerable<string> GetAllowedExtensions(string sectionKeyPath)
        {
            IConfiguration configuration = GetConfiguration();
            return configuration.GetSection(sectionKeyPath).Get<List<string>>();
        }

        private static IEnumerable<string> GetMediaFiles(string mediaPath, IEnumerable<string> allowedExtentions)
        {
            IEnumerable<string> files = FolderDataAccess.GetAllFiles(mediaPath);
            IList<string> imagesFileNameList = new List<string>();
            foreach (string file in files)
            {
                foreach (string extention in allowedExtentions)
                {
                    string allowedExtention = extention;
                    if (allowedExtention.First() != '.')
                        allowedExtention = "." + allowedExtention;

                    if (Path.GetExtension(file).ToLower() != allowedExtention)
                        continue;

                    var fileName = Path.GetFileName(file);
                    imagesFileNameList.Add(fileName);
                }
            }

            return imagesFileNameList;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="map"></param>
        /// <param name="format"></param>
        /// <returns></returns>
        /// <exception cref="FormatException"></exception>
        /// <exception cref="NullReferenceException"></exception>
        public static JsonObject ExportMapWithFormat(string map, string format)
        {
            if (format != "json")
                throw new FormatException();

            JsonElement jsonElementLayers;
            JsonElement jsonElementMaps;
            try
            {
                jsonElementLayers = GetLayersAsJsonDocument().RootElement;
                jsonElementMaps = GetMapAsJsonDocument(map).RootElement; ;
            }
            catch (Exception)
            {
                throw;
            }
            LayerExportItem layerExportItems = new LayerExportItem();
            layerExportItems = FilterLayers(jsonElementLayers);
            JsonObject? jsonObjectLayerExportItems = JsonUtility.ConvertToJsonObject(layerExportItems.layers);
            if (map == "layers")
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

        private static LayerExportItem FilterLayers(JsonElement jsonElementLayers)
        {
            LayerExportItem layerExportItems = new LayerExportItem();

            var input = "$[*][*]";
            var result = JsonPathUtility.GetJsonArray(jsonElementLayers, input);
            if (result == null)
                return layerExportItems;

            foreach (PathMatch path in result)
            {
                JsonElement caption;
                if (!path.Value.TryGetProperty("caption", out caption) && caption.GetString() == null)
                    continue;

                JsonElement id;
                if (!path.Value.TryGetProperty("id", out id) && id.GetString() == null)
                    continue;

                JsonElement layers;
               if (!path.Value.TryGetProperty("layers", out layers))
               {
                    layerExportItems.layers.Add(id.GetString(), 
                        new LayerExportItem.LayerExportBaseItem(caption.GetString(), null));
                    continue;
               }

                List<string> subLayers = new List<string>();
                foreach (JsonElement subLayer in layers.EnumerateArray())
                {
                    if (subLayer.GetString() == null)
                        continue;

                    subLayers.Add(subLayer.GetString());
                }

                layerExportItems.layers.Add(id.GetString(), 
                    new LayerExportItem.LayerExportBaseItem(caption.GetString(), subLayers));
            }

            return layerExportItems;
        }

        private static JsonObject? FilterMaps(JsonElement jsonElementMaps, LayerExportItem layerExportItems)
        {
            List<MapExportItem.BaseLayerExportItem> baseLayers = new List<MapExportItem.BaseLayerExportItem>();
            List<MapExportItem.GroupExportItem> groups = new List<MapExportItem.GroupExportItem>();

            var input = "$.tools[?(@.type == 'layerswitcher')].options";
            var result = JsonPathUtility.GetJsonElement(jsonElementMaps, input);
            if (result == null)
                return null;

            JsonElement baselayers;
            if (!result.Value.TryGetProperty("baselayers", out baselayers))
                return null;

            List<string> baseLayerIds = GetArrayValues(baselayers, "id");
            foreach (string baseLayerId in baseLayerIds)
            {
                string caption = layerExportItems.layers[baseLayerId].caption;
                baseLayers.Add(new MapExportItem.BaseLayerExportItem(caption));
            }

            JsonElement groupsNode;
            if (!result.Value.TryGetProperty("groups", out groupsNode))
                return null;

            foreach (JsonElement element in groupsNode.EnumerateArray())
            {
                JsonElement name;
                if (!element.TryGetProperty("name", out name) && name.GetString() == null)
                    continue;

                JsonElement groupLayers;
                if (!element.TryGetProperty("layers", out groupLayers) && groupLayers.GetString() == null)
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