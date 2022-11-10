using MapService.Business.MapConfig;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace MapService.Controllers
{
    [Route("mapconfig")]
    [Produces("application/json")]
    [ApiController]
    public class MapConfigController : ControllerBase
    {
        private readonly ILogger<MapConfigController> _logger;

        public MapConfigController(ILogger<MapConfigController> logger)
        {
            _logger = logger;
        }

        [HttpGet()]
        [Route("listimage")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
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

            return listOfImages;
        }

        [HttpGet()]
        [Route("listvideo")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
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

            return listOfVideos;
        }

        [HttpGet()]
        [Route("listaudio")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Maps and layers" })]
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

            return listOfAudioFiles;
        }
    }
}