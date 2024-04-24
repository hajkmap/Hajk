using MapService.Business.Ad;
using MapService.Business.Settings;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Swashbuckle.AspNetCore.Annotations;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Nodes;

namespace MapService.Controllers
{
    [Route("api/v{version:apiVersion}/settings")]
    [ApiVersion("1.0")]
    [ApiVersion("2.0")]
    [Produces("application/json")]
    [ApiController]
    public class SettingsController : ControllerBase
    {
        private readonly IMemoryCache _memoryCache;
        private readonly ILogger<SettingsController> _logger;

        public SettingsController(IMemoryCache memoryCache, ILogger<SettingsController> logger)
        {
            _memoryCache = memoryCache;
            _logger = logger;
        }

        /// <remarks>
        /// Update the mapsettings of a map.
        /// </remarks>
        /// <param name="mapFile">Name of the map who's mapsettings config should be written.</param>
        /// <param name="requestBody">Settings for given map's mapsettings.</param>
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="204">All good</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        [HttpPut]
        [Route("mapsettings")]
        [MapToApiVersion("1.0")]
        [MapToApiVersion("2.0")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult UpdateMapSettings([Required] string mapFile, [Required][FromBody] JsonObject requestBody, [FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
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

                SettingsHandler.UpdateMapSettings(mapFile, requestBody);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status204NoContent);
        }

        /// <remarks>
        /// Update the LayerSwitcher component of a map.
        /// </remarks>
        /// <param name="mapFile">Name of the map of which the LayerSwitcher config should be written</param>
        /// <param name="requestBody">Settings for given map's LayerSwitcher component</param>
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="204">All good</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        [HttpPut]
        [Route("layermenu")]
        [MapToApiVersion("1.0")]
        [MapToApiVersion("2.0")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult UpdateLayerMenu([Required] string mapFile, [Required][FromBody] JsonObject requestBody, [FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
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

                SettingsHandler.UpdateLayerMenu(mapFile, requestBody);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status204NoContent);
        }

        /// <remarks>
        /// Update the tools configuration of a map.
        /// </remarks>
        /// <param name="mapFile">Name of the map who's tools configuration should be written.</param>
        /// <param name="toolSettings">Settings for given map's tools</param>
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="204">All good</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        [HttpPut]
        [Route("toolsettings")]
        [MapToApiVersion("1.0")]
        [MapToApiVersion("2.0")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult UpdateToolSettings([Required] JsonArray toolSettings, [Required] string mapFile, [FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
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

                SettingsHandler.UpdateToolSettings(toolSettings, mapFile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status204NoContent);
        }

        /// <remarks>
        /// Add a new layer of specified type
        /// </remarks>
        /// <param name="layerType">The type of layer that will be added.</param>
        /// <param name="requestBody">Content of the layer to be added.</param>
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="204">All good</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        [HttpPost]
        [Route("{layerType}")]
        [MapToApiVersion("1.0")]
        [MapToApiVersion("2.0")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult CreateOrUpdateLayerType(string layerType, [Required][FromBody] JsonObject requestBody, [FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
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

                SettingsHandler.UpdateLayerType(layerType, requestBody);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status204NoContent);
        }

        /// <remarks>
        /// Replace a specific layer with supplied content.
        /// </remarks>
        /// <param name="layerType">The type of layer that will be updated.</param>
        /// <param name="requestBody">Layer to be added or updated.</param>
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="204">All good</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        [HttpPut]
        [Route("{layerType}")]
        [MapToApiVersion("1.0")]
        [MapToApiVersion("2.0")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult UpdateLayerType(string layerType, [Required][FromBody] JsonObject requestBody, [FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
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

                SettingsHandler.UpdateLayerType(layerType, requestBody);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status204NoContent);
        }

        /// <remarks>
        /// Delete a layer.
        /// </remarks>
        /// <param name="layerId">Id of the layer to delete</param>
        /// <param name="type">The kind of layer to delete</param>
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="200">Layer deleted successfully</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        [HttpDelete]
        [Route("{type}/{layerId}")]
        [MapToApiVersion("1.0")]
        [MapToApiVersion("2.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult DeleteLayer(string type, string layerId, [FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
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

                SettingsHandler.DeleteLayer(type, layerId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK);
        }

        /// <remarks>
        /// Update a tool configuration of a map
        /// </remarks>
        /// <param name="map">Name of the map</param>
        /// <param name="tool">Name of the tool to be edited</param>
        /// <param name="requestBody">Name of the tool to be edited</param>
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="201">Created</response>
        /// <response code="204">Updated</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        [HttpPut]
        [Route("update/{map}/{tool}")]
        [MapToApiVersion("1.0")]
        [MapToApiVersion("2.0")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult UpdateMapTool([Required] string map, [Required] string tool, [Required][FromBody] JsonObject requestBody, [FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
        {
            int statusCode;

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

                statusCode = SettingsHandler.UpdateMapTool(map, tool, requestBody);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(statusCode);
        }
    }
}