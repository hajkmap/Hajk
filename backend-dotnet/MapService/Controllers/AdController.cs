using MapService.Business.Ad;
using MapService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Swashbuckle.AspNetCore.Annotations;

namespace MapService.Controllers
{
    [Route("api/v{version:apiVersion}/ad")]
    [ApiVersion("2.0")]
    [Produces("application/json")]
    [ApiController]
    public class AdController : ControllerBase
    {
        private readonly IMemoryCache _memoryCache;
        private readonly ILogger<ConfigController> _logger;

        public AdController(IMemoryCache memoryCache, ILogger<ConfigController> logger)
        {
            _memoryCache = memoryCache;
            _logger = logger;
        }

        /// <remarks>
        /// Get a list of all available AD groups to make it easier for admins to set map and layer permissions
        /// </remarks>
        /// <param name="userIdentity">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="200">Success</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("availableadgroups")]
        [MapToApiVersion("2.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - ActiveDirectory" })]
        public ActionResult GetAvailableADGroups([FromHeader(Name = "X-Control-Header")] string? userIdentity)
        {
            IEnumerable<string?> availableADGroups;

            try
            {
                if (!AdHandler.AdIsActive)
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, "Can't access AD methods because AD functionality is disabled.");
                }

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

                userIdentity = adHandler.PickUserNameToUse(Request, userIdentity);

                if (!adHandler.UserIsValid(userIdentity) || !AdHandler.UserHasAdAccess(userIdentity, _logger))
                {
                    return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                }

                availableADGroups = adHandler.GetAvailableADGroups().Select(x => x.Cn);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, availableADGroups);
        }

        /// <remarks>
        /// Find out which AD group membership is shared between specified users
        /// </remarks>
        /// <param name="userIdentity">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="200">Success</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("findcommongroupsforusers")]
        [MapToApiVersion("2.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - ActiveDirectory" })]
        public ActionResult FindCommonGroupsForUsers([FromHeader(Name = "X-Control-Header")] string userIdentity, [FromQuery] IEnumerable<string> users)
        {
            IEnumerable<string?> commonGroupsForUsers;

            try
            {
                if (!AdHandler.AdIsActive)
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, "Can't access AD methods because AD functionality is disabled");
                }

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

                userIdentity = adHandler.PickUserNameToUse(Request, userIdentity);

                if (!adHandler.UserIsValid(userIdentity) || !AdHandler.UserHasAdAccess(userIdentity, _logger))
                {
                    return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                }

                commonGroupsForUsers = adHandler.FindCommonGroupsForUsers(users).Select(x => x.Cn); ;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, commonGroupsForUsers);
        }

        /// <remarks>
        /// Get the current content of local AD Users store
        /// </remarks>
        /// <param name="userIdentity">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="200">Success</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("users")]
        [MapToApiVersion("2.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - ActiveDirectory" })]
        public ActionResult GetUsers([FromHeader(Name = "X-Control-Header")] string userIdentity)
        {
            Dictionary<string, AdUser> users;

            try
            {
                if (!AdHandler.AdIsActive)
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, "Can't access AD methods because AD functionality is disabled.");
                }

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

                userIdentity = adHandler.PickUserNameToUse(Request, userIdentity);

                if (!adHandler.UserIsValid(userIdentity) || !AdHandler.UserHasAdAccess(userIdentity, _logger))
                {
                    return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                }

                users = adHandler.GetUsers();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, users);
        }

        /// <remarks>
        /// Get the current content of local AD Groups store
        /// </remarks>
        /// <param name="userIdentity">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="200">Success</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("groups")]
        [MapToApiVersion("2.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - ActiveDirectory" })]
        public ActionResult GetGroups([FromHeader(Name = "X-Control-Header")] string userIdentity)
        {
            IEnumerable<string?> groups;

            try
            {
                if (!AdHandler.AdIsActive)
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, "Can't access AD methods because AD functionality is disabled");
                }

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

                userIdentity = adHandler.PickUserNameToUse(Request, userIdentity);

                if (!adHandler.UserIsValid(userIdentity) || !AdHandler.UserHasAdAccess(userIdentity, _logger))
                {
                    return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                }

                groups = adHandler.GetGroups().Select(x => x.Cn);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, groups);
        }

        /// <remarks>
        /// Get the current content of local AD groups per user store
        /// </remarks>
        /// <param name="userIdentity">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="200">Success</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("groupsPerUser")]
        [MapToApiVersion("2.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - ActiveDirectory" })]
        public ActionResult GetGroupsPerUser([FromHeader(Name = "X-Control-Header")] string userIdentity)
        {
            Dictionary<string, IEnumerable<string>> groupsPerUser;

            try
            {
                if (!AdHandler.AdIsActive)
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, "Can't access AD methods because AD functionality is disabled");
                }

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

                userIdentity = adHandler.PickUserNameToUse(Request, userIdentity);

                if (!adHandler.UserIsValid(userIdentity) || !AdHandler.UserHasAdAccess(userIdentity, _logger))
                {
                    return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                }

                groupsPerUser = adHandler.GetGroupsPerUser();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, groupsPerUser);
        }

        /// <remarks>
        /// Flush the contents of all local AD stores (removes the cached objects)
        /// </remarks>
        /// <param name="userIdentity">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="200">Success</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        [HttpPut]
        [Route("flushStores")]
        [MapToApiVersion("2.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - ActiveDirectory" })]
        public ActionResult FlushStores([FromHeader(Name = "X-Control-Header")] string userIdentity)
        {
            try
            {
                if (!AdHandler.AdIsActive)
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, "Can't access AD methods because AD functionality is disabled");
                }

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

                userIdentity = adHandler.PickUserNameToUse(Request, userIdentity);

                if (!adHandler.UserIsValid(userIdentity) || !AdHandler.UserHasAdAccess(userIdentity, _logger))
                {
                    return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                }

                adHandler.FlushStores();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, "All local caches successfully flushed.");
        }
    }
}