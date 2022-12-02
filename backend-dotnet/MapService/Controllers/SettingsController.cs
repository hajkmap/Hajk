using MapService.Business.Settings;
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
        [Route("layermenu")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult UpdateLayerMenu([Required] string mapFile, [Required][FromBody] JsonObject requestBody)
        {
            try
            {
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
        ///
        /// </remarks>
        /// <response code="204">All good</response>
        /// <response code="500">Internal Server Error</response>
        [HttpPost]
        [Route("{layerType}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult CreateLayerType(string layerType, [Required][FromBody] JsonObject requestBody)
        {
            try
            {
                SettingsHandler.CreateLayerType(layerType, requestBody);
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
        [Route("{layerType}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult UpdateLayerType(string layerType, [Required][FromBody] JsonObject requestBody)
        {
            try
            {
                SettingsHandler.UpdateLayerType(layerType, requestBody);
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