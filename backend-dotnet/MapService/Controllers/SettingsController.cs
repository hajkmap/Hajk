using MapService.Business.Settings;
using MapService.Models;
using MapService.Utility;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Nodes;

namespace MapService.Controllers
{
    [Route("settings")]
    [Produces("application/json")]
    [ApiController]
    public class SettingsController : ControllerBase
    {
        private readonly ILogger<SettingsController> _logger;

        public SettingsController(ILogger<SettingsController> logger)
        {
            _logger = logger;
        }

        /// <remarks>
        ///
        /// </remarks>
        /// <response code="204">All good</response>
        /// <response code="500">Internal Server Error</response>
        [HttpPut]
        [Route("mapsettings")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult UpdateMapSettings([Required] string mapFile, [Required][FromBody] JsonObject requestBody)
        {
            try
            {
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
        ///
        /// </remarks>
        /// <response code="204">All good</response>
        /// <response code="500">Internal Server Error</response>
        [HttpPut]
        [Route("toolsettings")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult UpdateToolSettings([Required]JsonObject toolSettings, [Required]string mapFile)
        {
            try
            {                
                SettingsHandler.UpdateToolSettings(toolSettings, mapFile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status204NoContent);
        }
    }
}