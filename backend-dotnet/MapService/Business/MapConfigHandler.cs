using MapService.DataAccess;
using MapService.Models;
using System.Text.Json.Nodes;

namespace MapService.Business.MapConfig
{
    public static class MapConfigHandler
    {
        public static JsonObject GetLayers()
        {
            return JsonFileDataAccess.ReadLayerFile();
        }

        /// <summary>
        /// Gets a map as a JsonObject.
        /// </summary>
        /// <param name="mapFileName">The name of the map including the file ending. </param>
        /// <returns>Returns a map as a JsonObject. </returns>
        public static JsonObject GetMap(string mapFileName)
        {
            return JsonFileDataAccess.ReadMapFileAsJsonObject(mapFileName);
        }

        /// <summary>
        /// Gets all maps names.
        /// </summary>
        /// <returns>Return all map names.</returns>
        public static IEnumerable<string> GetMaps()
        {
            return JsonFileDataAccess.GetMapConfigFiles();
        }

        public static IEnumerable<string> GetListOfImages()
        {
            var imageFileNameList = new List<string>();

            var uploadContentRootPath = AppDomain.CurrentDomain.GetData("UploadContentRootPath") as string;

            if (uploadContentRootPath == null)
            {
                return imageFileNameList;
            }

            var files = FolderDataAccess.GetAllFiles(uploadContentRootPath);

            foreach (string file in files)
            {
                if (Path.GetExtension(file).ToLower() == ".png" || Path.GetExtension(file).ToLower() == ".jpeg" || Path.GetExtension(file).ToLower() == ".jpg")
                {
                    var fileName = Path.GetFileName(file);
                    imageFileNameList.Add(fileName);
                }
            }

            return imageFileNameList;
        }

        public static IEnumerable<string> GetListOfVideos()
        {
            var videoFileNameList = new List<string>();

            var uploadContentRootPath = AppDomain.CurrentDomain.GetData("UploadContentRootPath") as string;

            if (uploadContentRootPath == null)
            {
                return videoFileNameList;
            }

            var files = FolderDataAccess.GetAllFiles(uploadContentRootPath);

            foreach (string file in files)
            {
                if (Path.GetExtension(file).ToLower() == ".mp4" || Path.GetExtension(file).ToLower() == ".mov" || Path.GetExtension(file).ToLower() == ".ogg")
                {
                    var fileName = Path.GetFileName(file);
                    videoFileNameList.Add(fileName);
                }
            }

            return videoFileNameList;
        }

        public static IEnumerable<string> GetListOfAudioFiles()
        {
            var audioFileNameList = new List<string>();

            var uploadContentRootPath = AppDomain.CurrentDomain.GetData("UploadContentRootPath") as string;

            if (uploadContentRootPath == null)
            {
                return audioFileNameList;
            }

            var files = FolderDataAccess.GetAllFiles(uploadContentRootPath);

            foreach (string file in files)
            {
                if (Path.GetExtension(file).ToLower() == ".mp3" || Path.GetExtension(file).ToLower() == ".wav" || Path.GetExtension(file).ToLower() == ".ogg")
                {
                    var fileName = Path.GetFileName(file);
                    audioFileNameList.Add(fileName);
                }
            }

            return audioFileNameList;
        }

        public static JsonObject ExportMapWithFormat(string map, string format)
        {
            if (format != "json")
                throw new FormatException();

            JsonObject? jsonObjectMap;
            JsonObject? jsonObjectLayers;
            try
            {
                jsonObjectMap = GetMap(map);
                jsonObjectLayers = GetLayers();
            }
            catch (Exception)
            {
                throw;
            }
            LayerExportItem layerExportItems = FilterLayers(jsonObjectLayers);
            JsonObject? jsonObjectLayerExportItems = HandlerUtility.ConvertToJsonObject(layerExportItems.layers);
            if (map == "layers")
            {
                if (jsonObjectLayerExportItems == null)
                    throw new NullReferenceException();

                return jsonObjectLayerExportItems;
            }

            JsonObject? jsonObjectMapExportItems = FilterMaps(jsonObjectMap, layerExportItems);
            if (jsonObjectMapExportItems == null)
                throw new NullReferenceException();

            return jsonObjectMapExportItems;
        }

        private static LayerExportItem FilterLayers(JsonObject jsonObject)
        {
            LayerExportItem layerExportItems = new LayerExportItem();
            foreach (KeyValuePair<string, JsonNode?> root in jsonObject)
            {
                if (root.Value == null)
                    continue;

                foreach (JsonObject? layer in root.Value.AsArray())
                {
                    if (layer == null)
                        continue;

                    string? caption = (string?)layer.AsObject()["caption"];
                    string? id = (string?)layer.AsObject()["id"];
                    if (id == null)
                        continue;

                    JsonNode? layers = layer["layers"];
                    if (layers == null)
                    {
                        layerExportItems.layers.Add(id, new LayerExportItem.LayerExportBaseItem(caption, null));
                        continue;
                    }

                    List<string> subLayers = new List<string>();
                    foreach (JsonNode? subLayer in layers.AsArray())
                    {
                        if (subLayer == null)
                            continue;

                        subLayers.Add(subLayer.ToString());
                    }

                    layerExportItems.layers.Add(id, new LayerExportItem.LayerExportBaseItem(caption, subLayers));
                }
            }

            return layerExportItems;
        }

        private static JsonObject? FilterMaps(JsonObject jsonObjectMap, LayerExportItem layerExportItems)
        {
            List<MapExportItem.BaseLayerExportItem> baseLayers = new List<MapExportItem.BaseLayerExportItem>();
            List<MapExportItem.GroupExportItem> groups = new List<MapExportItem.GroupExportItem>();

            JsonNode? tools = jsonObjectMap["tools"];
            if (tools == null)
                throw new Exception();

            foreach (JsonNode? tool in tools.AsArray())
            {
                if (tool == null)
                    continue;

                JsonNode? type = tool["type"];
                if (type == null || type.ToString() != "layerswitcher")
                    continue;

                JsonNode? options = tool["options"];
                if (options == null)
                    continue;

                JsonNode? baselayers = options["baselayers"];
                if (baselayers == null)
                    continue;

                List<string> baseLayerIds = new List<string>();
                foreach (JsonNode? baselayer in baselayers.AsArray())
                {
                    if (baselayer == null)
                        continue;

                    string? id = (string?)baselayer["id"];
                    if (id == null)
                        continue;

                    baseLayerIds.Add(id);
                }

                foreach (string baseLayerId in baseLayerIds)
                {
                    string caption = layerExportItems.layers[baseLayerId].caption;
                    baseLayers.Add(new MapExportItem.BaseLayerExportItem(caption));
                }

                JsonNode? groupsNode = options["groups"];
                if (groupsNode == null)
                    continue;

                List<string> Ids = new List<string>();
                foreach (JsonNode? group in groupsNode.AsArray())
                {
                    if (group == null)
                        continue;

                    string? name = (string?)group["name"];
                    if (name == null)
                        continue;

                    JsonNode? layers = group["layers"];
                    if (layers == null)
                        continue;

                    foreach (JsonNode? layer in layers.AsArray())
                    {
                        if (layer == null)
                            continue;

                        string? id = (string?)layer["id"];
                        if (id == null)
                            continue;

                        Ids.Add(id);
                    }

                    List<MapExportItem.GroupExportItem.GroupLayerExportItem> layersInGroup = new List<MapExportItem.GroupExportItem.GroupLayerExportItem>();
                    foreach (string id in Ids)
                    {
                        LayerExportItem.LayerExportBaseItem layerExportItem = layerExportItems.layers[id];
                        MapExportItem.GroupExportItem.GroupLayerExportItem groupLayerExportItem =
                            new MapExportItem.GroupExportItem.GroupLayerExportItem(layerExportItem);
                        layersInGroup.Add(groupLayerExportItem);
                    }
                    groups.Add(new MapExportItem.GroupExportItem(name, layersInGroup));
                    Ids.Clear();
                }
            }

            MapExportItem mapExportItem = new MapExportItem(baseLayers, groups);
            return HandlerUtility.ConvertToJsonObject(mapExportItem);
        }
    }
}