using MapService.Business.Ad;
using MapService.Business.Config;
using MapService.Business.MapConfig;
using MapService.Filters;
using MapService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Swashbuckle.AspNetCore.Annotations;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace MapService.Controllers
{
    [Route("api/v{version:apiVersion}/config")]
    [ApiVersion("1.0")]
    [ApiVersion("2.0")]
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
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="200">All layers were fetched successfully</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("layers")]
        [MapToApiVersion("1.0")]
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

                    string? remoteIpAddress = adHandler.GetRemoteIpAddress(HttpContext);
                    if (!adHandler.IpRangeRestrictionIsSet())
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active but no IP range restriction is set in appsettings.json file."
                                               + " This means that you accept the value of X-Control-Header from any request, which is potentially a huge security risk!.");
                    }
                    if (!adHandler.RequestComesFromAcceptedIp(HttpContext))
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication does not allow requests from " + remoteIpAddress + ". Aborting.");
                    }

                    userPrincipalName = adHandler.PickUserNameToUse(Request, userPrincipalName);

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
        /// Get the map config, together with all needed layers (depending on which layer id:s are found in the map config), a list of user specific maps
        /// if the config map property "mapselector" is set to true, and user information if AD is acitve and the settings flag that user should be returned is set to true.
        /// </remarks>
        /// <param name="map">The map file to be retrieved</param>
        /// <param name="userPrincipalName">User name that will be supplied to AD</param>
        /// <response code="200">All fetched successfully</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("{map}")]
        [MapToApiVersion("2.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Client-accessible" })]
        public ActionResult GetMapWithLayers(string map, [FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
        {
            JsonObject? mapWithLayers;

            try
            {
                JsonObject? mapObject = MapConfigHandler.GetMapAsJsonObject(map);
                var userSpecificMaps = ConfigHandler.GetUserSpecificMaps();
                AdUser? adUser = null;

                if (AdHandler.AdIsActive)
                {
                    var adHandler = new AdHandler(_memoryCache, _logger);

                    string? remoteIpAddress = adHandler.GetRemoteIpAddress(HttpContext);
                    if (!adHandler.IpRangeRestrictionIsSet())
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active but no IP range restriction is set in appsettings.json file."
                                               + " This means that you accept the value of X-Control-Header from any request, which is potentially a huge security risk!.");
                    }
                    if (!adHandler.RequestComesFromAcceptedIp(HttpContext))
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication does not allow requests from " + remoteIpAddress + ". Aborting.");
                    }

                    userPrincipalName = adHandler.PickUserNameToUse(Request, userPrincipalName);

                    if (userPrincipalName == null || !adHandler.UserIsValid(userPrincipalName))
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active, but supplied user name could not be validated.");
                    }

                    adHandler.GetGroupsPerUser().TryGetValue(userPrincipalName, out var adUserGroups);

                    mapObject = ConfigFilter.FilterMaps(map, adUserGroups);

                    if (mapObject == null)
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, String.Format("Access to {0} not allowed for user {1}.", map, userPrincipalName));
                    }

                    userSpecificMaps = ConfigFilter.FilterUserSpecificMaps(userSpecificMaps, adUserGroups);

                    if (AdHandler.ExposeUserObject)
                    {
                        adUser = adHandler.FindUser(userPrincipalName);
                    }
                }

                mapWithLayers = ConfigHandler.GetMapWithLayers(mapObject, userSpecificMaps, adUser);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, mapWithLayers);
        }

        /// <remarks>
        /// Get the map config.
        /// </remarks>
        /// <param name="map">The map file to be retrieved</param>
        /// <param name="userPrincipalName">User name that will be supplied to AD</param>
        /// <response code="200">All fetched successfully</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("{map}")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Client-accessible" })]
        public ActionResult GetMap(string map, [FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
        {
            JsonObject? mapObject;

            try
            {
                mapObject = MapConfigHandler.GetMapAsJsonObject(map);

                if (AdHandler.AdIsActive)
                {
                    var adHandler = new AdHandler(_memoryCache, _logger);

                    string? remoteIpAddress = adHandler.GetRemoteIpAddress(HttpContext);
                    if (!adHandler.IpRangeRestrictionIsSet())
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active but no IP range restriction is set in appsettings.json file."
                                               + " This means that you accept the value of X-Control-Header from any request, which is potentially a huge security risk!.");
                    }
                    if (!adHandler.RequestComesFromAcceptedIp(HttpContext))
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication does not allow requests from " + remoteIpAddress + ". Aborting.");
                    }

                    userPrincipalName = adHandler.PickUserNameToUse(Request, userPrincipalName);

                    if (userPrincipalName == null || !adHandler.UserIsValid(userPrincipalName))
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                    }

                    adHandler.GetGroupsPerUser().TryGetValue(userPrincipalName, out var adUserGroups);

                    mapObject = ConfigFilter.FilterMaps(map, adUserGroups);

                    if (mapObject == null)
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, String.Format("Access to {0} not allowed for user {1}.", map, userPrincipalName));
                    }
                }
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
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="200">Success</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("delete/{name}")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult Delete(string name, [FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
        {
            try
            {
                if (AdHandler.AdIsActive)
                {
                    var adHandler = new AdHandler(_memoryCache, _logger);

                    string? remoteIpAddress = adHandler.GetRemoteIpAddress(HttpContext);
                    if (!adHandler.IpRangeRestrictionIsSet())
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active but no IP range restriction is set in appsettings.json file."
                                               + " This means that you accept the value of X-Control-Header from any request, which is potentially a huge security risk!.");
                    }
                    if (!adHandler.RequestComesFromAcceptedIp(HttpContext))
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication does not allow requests from " + remoteIpAddress + ". Aborting.");
                    }

                    userPrincipalName = adHandler.PickUserNameToUse(Request, userPrincipalName);

                    if (!adHandler.UserIsValid(userPrincipalName) || !AdHandler.UserHasAdAccess(userPrincipalName, _logger))
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                    }
                }

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
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="200">All layers were fetched successfully</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("userspecificmaps")]
        [MapToApiVersion("1.0")]
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

                    string? remoteIpAddress = adHandler.GetRemoteIpAddress(HttpContext);
                    if (!adHandler.IpRangeRestrictionIsSet())
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active but no IP range restriction is set in appsettings.json file."
                                               + " This means that you accept the value of X-Control-Header from any request, which is potentially a huge security risk!.");
                    }
                    if (!adHandler.RequestComesFromAcceptedIp(HttpContext))
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication does not allow requests from " + remoteIpAddress + ". Aborting.");
                    }

                    userPrincipalName = adHandler.PickUserNameToUse(Request, userPrincipalName);

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
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <returns>Return all map names. </returns>
        /// <response code="200">All map names were fetched successfully</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("list")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult<IEnumerable<string>> GetMaps([FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
        {
            IEnumerable<string> maps;

            try
            {
                if (AdHandler.AdIsActive)
                {
                    var adHandler = new AdHandler(_memoryCache, _logger);

                    string? remoteIpAddress = adHandler.GetRemoteIpAddress(HttpContext);
                    if (!adHandler.IpRangeRestrictionIsSet())
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active but no IP range restriction is set in appsettings.json file."
                                               + " This means that you accept the value of X-Control-Header from any request, which is potentially a huge security risk!.");
                    }
                    if (!adHandler.RequestComesFromAcceptedIp(HttpContext))
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication does not allow requests from " + remoteIpAddress + ". Aborting.");
                    }

                    userPrincipalName = adHandler.PickUserNameToUse(Request, userPrincipalName);

                    if (!adHandler.UserIsValid(userPrincipalName) || !AdHandler.UserHasAdAccess(userPrincipalName, _logger))
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                    }
                }

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
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="200">Available images were fetched successfully</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet()]
        [Route("listimage")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult<IEnumerable<string>> GetListImage([FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
        {
            var listOfImages = new List<string>();

            try
            {
                if (AdHandler.AdIsActive)
                {
                    var adHandler = new AdHandler(_memoryCache, _logger);

                    string? remoteIpAddress = adHandler.GetRemoteIpAddress(HttpContext);
                    if (!adHandler.IpRangeRestrictionIsSet())
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active but no IP range restriction is set in appsettings.json file."
                                               + " This means that you accept the value of X-Control-Header from any request, which is potentially a huge security risk!.");
                    }
                    if (!adHandler.RequestComesFromAcceptedIp(HttpContext))
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication does not allow requests from " + remoteIpAddress + ". Aborting.");
                    }

                    userPrincipalName = adHandler.PickUserNameToUse(Request, userPrincipalName);

                    if (!adHandler.UserIsValid(userPrincipalName) || !AdHandler.UserHasAdAccess(userPrincipalName, _logger))
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                    }
                }

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
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="200">Available videos were fetched successfully</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet()]
        [Route("listvideo")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult<IEnumerable<string>> GetListVideo([FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
        {
            var listOfVideos = new List<string>();

            try
            {
                if (AdHandler.AdIsActive)
                {
                    var adHandler = new AdHandler(_memoryCache, _logger);

                    string? remoteIpAddress = adHandler.GetRemoteIpAddress(HttpContext);
                    if (!adHandler.IpRangeRestrictionIsSet())
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active but no IP range restriction is set in appsettings.json file."
                                               + " This means that you accept the value of X-Control-Header from any request, which is potentially a huge security risk!.");
                    }
                    if (!adHandler.RequestComesFromAcceptedIp(HttpContext))
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication does not allow requests from " + remoteIpAddress + ". Aborting.");
                    }

                    userPrincipalName = adHandler.PickUserNameToUse(Request, userPrincipalName);

                    if (!adHandler.UserIsValid(userPrincipalName) || !AdHandler.UserHasAdAccess(userPrincipalName, _logger))
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                    }
                }

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
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="200">Available audio files were fetched successfully</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet()]
        [Route("listaudio")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult<IEnumerable<string>> GetListAudio([FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
        {
            var listOfAudioFiles = new List<string>();

            try
            {
                if (AdHandler.AdIsActive)
                {
                    var adHandler = new AdHandler(_memoryCache, _logger);

                    string? remoteIpAddress = adHandler.GetRemoteIpAddress(HttpContext);
                    if (!adHandler.IpRangeRestrictionIsSet())
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active but no IP range restriction is set in appsettings.json file."
                                               + " This means that you accept the value of X-Control-Header from any request, which is potentially a huge security risk!.");
                    }
                    if (!adHandler.RequestComesFromAcceptedIp(HttpContext))
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication does not allow requests from " + remoteIpAddress + ". Aborting.");
                    }

                    userPrincipalName = adHandler.PickUserNameToUse(Request, userPrincipalName);

                    if (!adHandler.UserIsValid(userPrincipalName) || !AdHandler.UserHasAdAccess(userPrincipalName, _logger))
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                    }
                }

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
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="200">The map configuration was created successfully</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("create/{name}")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult Create(string name, [FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
        {
            try
            {
                if (AdHandler.AdIsActive)
                {
                    var adHandler = new AdHandler(_memoryCache, _logger);

                    string? remoteIpAddress = adHandler.GetRemoteIpAddress(HttpContext);
                    if (!adHandler.IpRangeRestrictionIsSet())
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active but no IP range restriction is set in appsettings.json file."
                                               + " This means that you accept the value of X-Control-Header from any request, which is potentially a huge security risk!.");
                    }
                    if (!adHandler.RequestComesFromAcceptedIp(HttpContext))
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication does not allow requests from " + remoteIpAddress + ". Aborting.");
                    }

                    userPrincipalName = adHandler.PickUserNameToUse(Request, userPrincipalName);

                    if (!adHandler.UserIsValid(userPrincipalName) || !AdHandler.UserHasAdAccess(userPrincipalName, _logger))
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                    }
                }

                MapConfigHandler.CreateMapConfiguration(name);
            }
            catch (IOException iex)
            {
                _logger.LogError(iex, "Internal Server Error");
                return StatusCode(StatusCodes.Status500InternalServerError, "Kartan " + name + " finns redan. Ta bort kartan " + name + " innan du skapar om den p� nytt. ");
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