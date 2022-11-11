using MapService.Business.MapConfig;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Text.Json.Nodes;

namespace MapService.Controllers
{
    [Route("config")]
    [Produces("application/json")]
    [ApiController]
    public class ConfigController : ControllerBase
    {
        private readonly ILogger<ConfigController> _logger;

        public ConfigController(ILogger<ConfigController> logger)
        {
            _logger = logger;
        }

        /// <remarks>
        /// List available layers, do not apply any visibility restrictions (required for Admin UI)
        /// </remarks>
        /// <response code="200">All layers were fetched successfully</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("layers")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
        [Obsolete]
        public ActionResult<IEnumerable<string>> GetLayers()
        {
            JsonObject layerObject;

            try
            {
                layerObject = MapConfigHandler.GetLayers();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, layerObject);
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
    }
}