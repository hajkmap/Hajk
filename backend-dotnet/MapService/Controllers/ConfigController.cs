using MapService.Business.Ad;
using MapService.Business.Config;
using MapService.Business.MapConfig;
using MapService.Filter;
using MapService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Swashbuckle.AspNetCore.Annotations;
using System.Text.Json;

namespace MapService.Controllers
{
    [Route("config")]
    [Produces("application/json")]
    [ApiController]
    public class ConfigController : ControllerBase
    {
        private readonly IMemoryCache _memoryCache;
        private readonly ILogger<ConfigController> _logger;

        public ConfigController(IMemoryCache memoryCache, ILogger<ConfigController> logger)
        {
            _memoryCache = memoryCache;
            _logger = logger;
        }

        /// <remarks>
        /// List available layers. If AD authentication is active, filter by user's permission
        /// </remarks>
        /// <response code="200">All layers were fetched successfully</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("layers")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Client-accessible" })]
        public ActionResult GetLayers([FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
        {
            JsonDocument layerObject;

            try
            {
                if (AdHandler.AdIsActive)
                {
                    var adHandler = new AdHandler(_memoryCache, _logger);

                    if (userPrincipalName == null || !adHandler.UserIsValid(userPrincipalName))
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active, but supplied user name could not be validated.");
                    }
                }

                layerObject = MapConfigHandler.GetLayersAsJsonDocument();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, layerObject);
        }

        /// <remarks>
        /// Gets a map as a JsonObject.
        /// </remarks>
        /// <param name="map">The name of the map including the file ending. </param>
        /// <returns>Returns a map as a JsonObject. </returns>
        [HttpGet]
        [Route("{map}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Client-accessible" })]
        [Obsolete]
        public ActionResult GetMap(string map)
        {
            JsonDocument mapObject;

            try
            {
                mapObject = MapConfigHandler.GetMapAsJsonDocument(map);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, mapObject);
        }

        /// <remarks>
        /// Delete an existing map configuration
        /// </remarks>
        /// <param name="name">Name of the map to be deleted</param>
        [HttpGet]
        [Route("delete/{name}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        [Obsolete]
        public ActionResult Delete(string name)
        {
            try
            {
                MapConfigHandler.DeleteMap(name);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK);
        }

        /// <remarks>
        /// List available layers, do not apply any visibility restrictions (required for Admin UI)
        /// </remarks>
        /// <response code="200">All layers were fetched successfully</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("userspecificmaps")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Client-accessible" })]
        public ActionResult<IEnumerable<string>> GetUserSpecificMaps([FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
        {
            IEnumerable<UserSpecificMaps> userSpecificMaps;

            try
            {
                userSpecificMaps = ConfigHandler.GetUserSpecificMaps();

                if (AdHandler.AdIsActive)
                {
                    var adHandler = new AdHandler(_memoryCache, _logger);

                    if (userPrincipalName == null || !adHandler.UserIsValid(userPrincipalName))
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active, but supplied user name could not be validated.");
                    }

                    adHandler.GetGroupsPerUser().TryGetValue(userPrincipalName, out var adUserGroups);

                    userSpecificMaps = ConfigFilter.FilterUserSpecificMaps(userSpecificMaps, adUserGroups);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, userSpecificMaps);
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
        [Obsolete]
        public ActionResult<IEnumerable<string>> GetMaps()
        {
            IEnumerable<string> maps;

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
        [Obsolete]
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
        [Obsolete]
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
        [Obsolete]
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
        /// Create a new map configuration
        /// </summary>
        /// <param name="name">The name of the map to create </param>
        /// <response code="200">The map configuration was created successfully</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("create/{name}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        [Obsolete]
        public ActionResult Create(string name)
        {
            try
            {
                MapConfigHandler.CreateMapConfiguration(name);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK);
        }
    }
}