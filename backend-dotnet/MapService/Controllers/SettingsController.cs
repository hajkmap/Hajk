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
        [HttpPut]
        [Route("toolsettings")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult UpdateToolSettings([Required] JsonObject toolSettings, [Required] string mapFile)
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
        public ActionResult CreateOrUpdateLayerType(string layerType, [Required][FromBody] JsonObject requestBody)
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

        /// <remarks>
        ///
        /// </remarks>
        /// <response code="200">Layer deleted successfully</response>
        /// <response code="500">Internal Server Error</response>
        [HttpDelete]
        [Route("{type}/{layerId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult DeleteLayer(string type, string layerId)
        {
            try
            {
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
        ///
        /// </remarks>
        /// <param name="map">Name of the map</param>
        /// <param name="tool">Name of the tool to be edited</param>
        /// <param name="requestBody">Name of the tool to be edited</param>
        /// <response code="201">Created</response>
        /// <response code="204">Updated</response>
        /// <response code="500">Internal Server Error</response>
        [HttpPut]
        [Route("update/{map}/{tool}")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        public ActionResult UpdateMapTool([Required] string map, [Required] string tool, [Required][FromBody] JsonObject requestBody)
        {
            int statusCode;

            try
            {
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