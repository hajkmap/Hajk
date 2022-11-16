using MapService.Business.MapConfig;
using MapService.Models;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

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

            JsonObject jsonObject;
            try
            {
                jsonObject = MapConfigHandler.GetMap(map);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            if (map == "layers")
                jsonObject = GetLayers(jsonObject);
            else
                jsonObject = GetMaps(jsonObject);


            return StatusCode(StatusCodes.Status200OK, jsonObject);
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

                    List<string> subLayers = new List<string>();
                    foreach (JsonNode? subLayer in layer["layers"].AsArray())
                    {
                        if (subLayer == null)
                            continue; 

                        subLayers.Add(subLayer.ToString());
                    }

                    if (id == null)
                        continue;

                    layerExportItems.Add(id, new LayerExportItem(caption, subLayers));
                }
            }

            return ControllerUtility.ConvertToJsonObject(layerExportItems);
        }

        private JsonObject GetMaps(JsonObject jsonObject)
        {
            return jsonObject;
        }
    }
}