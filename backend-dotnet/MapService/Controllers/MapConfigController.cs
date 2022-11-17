using MapService.Business.MapConfig;
using MapService.Models;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Text.Json.Nodes;

namespace MapService.Controllers
{
    [Route("mapconfig")]
    [Produces("application/json")]
    [ApiController]
    public class MapConfigController : ControllerBase
    {
        private readonly ILogger<MapConfigController> _logger;

        public MapConfigController(ILogger<MapConfigController> logger)
        {
            _logger = logger;
        }

        /// <remarks>
        /// List available layers, do not apply any visibility restrictions (required for Admin UI)
        /// </remarks>
        /// <response code="200">All layers were fetched successfully</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("layers")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult<IEnumerable<string>> GetLayers()
        {
            JsonObject layerObject;

            try
            {
                layerObject = MapConfigHandler.GetLayers();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, layerObject);
        }

        /// <summary>
        /// Gets a map as a JsonObject. 
        /// </summary>
        /// <param name="map">The name of the map including the file ending. </param>
        /// <returns>Returns a map as a JsonObject. </returns>
        /// <response code="200">The map object fetched successfully</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("{map}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult<JsonObject> GetMap(string map)
        {
            JsonObject mapObject;

            try
            {
                mapObject = MapConfigHandler.GetMap(map);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, mapObject);
        }

        /// <remarks>
        /// Gets all maps names. 
        /// </remarks>
        /// <returns>Return all map names. </returns>
        /// <response code="200">All map names were fetched successfully</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("list")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult<IEnumerable<string>> GetMaps()
        {
            ICollection<string> maps;

            try
            {
                maps = MapConfigHandler.GetMaps();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, maps);
        }

        /// <remarks>
        /// List available images in the upload folder
        /// </remarks>
        /// <response code="200">Available images were fetched successfully</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet()]
        [Route("listimage")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult<IEnumerable<string>> GetListImage()
        {
            var listOfImages = new List<string>();

            try
            {
                listOfImages = MapConfigHandler.GetListOfImages().ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, listOfImages);
        }

        /// <remarks>
        /// List available videos in the upload folder
        /// </remarks>
        /// <response code="200">Available videos were fetched successfully</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet()]
        [Route("listvideo")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult<IEnumerable<string>> GetListVideo()
        {
            var listOfVideos = new List<string>();

            try
            {
                listOfVideos = MapConfigHandler.GetListOfVideos().ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, listOfVideos);
        }

        /// <remarks>
        /// List available audio files in the upload folder
        /// </remarks>
        /// <response code="200">Available audio files were fetched successfully</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet()]
        [Route("listaudio")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult<IEnumerable<string>> GetListAudio()
        {
            var listOfAudioFiles = new List<string>();

            try
            {
                listOfAudioFiles = MapConfigHandler.GetListOfAudioFiles().ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, listOfAudioFiles);
        }

        /// <summary>
        /// Exports a map with all available layers in a human-readable format. 
        /// </summary>
        /// <param name="map">The name of the map excluding the file ending. </param>
        /// <param name="format">Only Json-format is supported. </param>
        /// <returns>Returns a map as a JsonObject. </returns>
        /// <response code="200">The map object fetched successfully</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("export/{map}/{format}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult<JsonObject> ExportMapWithFormat(string map, string format)
        {
            if (format != "json")
                return StatusCode(StatusCodes.Status500InternalServerError, "Only json format is supported");

            JsonObject jsonObjectMap;
            JsonObject jsonObjectLayers;
            try
            {
                jsonObjectMap = MapConfigHandler.GetMap(map);
                jsonObjectLayers = MapConfigHandler.GetLayers();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }
            jsonObjectLayers = GetLayers(jsonObjectLayers);
            if (map == "layers")
                return StatusCode(StatusCodes.Status200OK, jsonObjectLayers);

            jsonObjectMap = GetMaps(jsonObjectMap, jsonObjectLayers);

            return StatusCode(StatusCodes.Status200OK, jsonObjectMap);
        }

        private JsonObject GetLayers(JsonObject jsonObject)
        {
            Dictionary<string, LayerExportItem> layerExportItems = new Dictionary<string, LayerExportItem>();
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
                        layerExportItems.Add(id, new LayerExportItem(caption, null));
                        continue;
                    }

                    List<string> subLayers = new List<string>();
                    foreach (JsonNode? subLayer in layers.AsArray())
                    {
                        if (subLayer == null)
                            continue; 

                        subLayers.Add(subLayer.ToString());
                    }

                    layerExportItems.Add(id, new LayerExportItem(caption, subLayers));
                }
            }

            return ControllerUtility.ConvertToJsonObject(layerExportItems);
        }

        private JsonObject GetMaps(JsonObject jsonObjectMap, JsonObject jsonObjectLayers)
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
                    JsonNode? layerInGroupNode = jsonObjectLayers[baseLayerId];
                    if (layerInGroupNode == null)
                        continue;

                    JsonObject? layerInGroup = layerInGroupNode.AsObject();
                    if (layerInGroup == null)
                        continue;

                    string? caption = (string?)layerInGroup["caption"];
                    if (caption == null)
                        continue;

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
                    foreach(string id in Ids)
                    {
                        JsonObject? layerInGroup = jsonObjectLayers[id].AsObject();

                        if (layerInGroup == null)
                            continue;

                        LayerExportItem layerExportItem = ControllerUtility.ConvertToJsonObject<LayerExportItem>(layerInGroup);
                        MapExportItem.GroupExportItem.GroupLayerExportItem groupLayerExportItem = new MapExportItem.GroupExportItem.GroupLayerExportItem(layerExportItem);
                        layersInGroup.Add(groupLayerExportItem);
                    }
                    groups.Add(new MapExportItem.GroupExportItem(name, layersInGroup));
                    Ids.Clear();
                }
            }

            MapExportItem mapExportItem = new MapExportItem(baseLayers, groups);
            return ControllerUtility.ConvertToJsonObject(mapExportItem);
        }
    }
}