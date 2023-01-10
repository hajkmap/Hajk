using MapService.Business.Ad;
using MapService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Swashbuckle.AspNetCore.Annotations;

namespace MapService.Controllers
{
    [Route("ad")]
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
        /// <response code="200">Success</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("availableadgroups")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - ActiveDirectory" })]
        public ActionResult GetAvailableADGroups([FromHeader(Name = "X-Control-Header")] string userPrincipalName)
        {
            IEnumerable<string?> availableADGroups;

            try
            {
                if (!AdHandler.AdIsActive)
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, "Can't access AD methods because AD functionality is disabled.");
                }

                var adHandler = new AdHandler(_memoryCache, _logger);

                if (!adHandler.UserIsValid(userPrincipalName) || !AdHandler.UserHasAdAccess(userPrincipalName))
                {
                    return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                }

                availableADGroups = adHandler.GetAvailableADGroups().Select(x => x.Cn);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, availableADGroups);
        }

        /// <remarks>
        /// Get the current content of local AD Users store
        /// </remarks>
        /// <response code="200">Success</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("users")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - ActiveDirectory" })]
        public ActionResult GetUsers([FromHeader(Name = "X-Control-Header")] string userPrincipalName)
        {
            Dictionary<string, AdUser> users;

            try
            {
                if (!AdHandler.AdIsActive)
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, "Can't access AD methods because AD functionality is disabled.");
                }

                var adHandler = new AdHandler(_memoryCache, _logger);

                if (!adHandler.UserIsValid(userPrincipalName) || !AdHandler.UserHasAdAccess(userPrincipalName))
                {
                    return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                }

                users = adHandler.GetUsers();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, users);
        }

        /// <remarks>
        /// Get the current content of local AD Groups store
        /// </remarks>
        /// <response code="200">Success</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("groups")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - ActiveDirectory" })]
        public ActionResult GetGroups([FromHeader(Name = "X-Control-Header")] string userPrincipalName)
        {
            IEnumerable<string?> groups;

            try
            {
                if (!AdHandler.AdIsActive)
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, "Can't access AD methods because AD functionality is disabled");
                }

                var adHandler = new AdHandler(_memoryCache, _logger);

                if (!adHandler.UserIsValid(userPrincipalName) || !AdHandler.UserHasAdAccess(userPrincipalName))
                {
                    return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                }

                groups = adHandler.GetGroups().Select(x => x.Cn);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, groups);
        }
    }
}