using MapService.Business.Ad;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Text.Json.Nodes;

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

        /// <summary>
        /// Gets a map as a JsonObject. 
        /// </summary>
        /// <param name="map">The name of the map including the file ending. </param>
        /// <returns>Returns a map as a JsonObject. </returns>
        [HttpGet]
        [Route("mapconfig/{map}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult<JsonObject> GetMap(string map)
        {
            JsonObject mapObject;

            try
            {
                mapObject = AdHandler.GetMap(map);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, mapObject);
        }
    }
}
