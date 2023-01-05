using MapService.Business.Ad;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace MapService.Controllers
{
    [Route("ad")]
    [Produces("application/json")]
    [ApiController]
    public class AdController : ControllerBase
    {
        private readonly ILogger<ConfigController> _logger;

        public AdController(ILogger<ConfigController> logger)
        {
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
            IEnumerable<string> availableADGroups;

            try
            {
                if (!AdHandler.AdIsActive)
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, "Can't access AD methods because AD functionality is disabled.");
                }

                if (!AdHandler.UserHasAdAccess(userPrincipalName))
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active, but supplied user name could not be validated.");
                }

                availableADGroups = AdHandler.GetAvailableADGroups();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, availableADGroups);
        }
    }
}