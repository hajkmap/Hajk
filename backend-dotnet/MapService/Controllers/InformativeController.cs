using MapService.Business.Informative;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Text.Json.Nodes;

namespace MapService.Controllers
{
    [Route("informative")]
    [Produces("application/json")]
    [ApiController]
    public class InformativeController : ControllerBase
    {
        private readonly ILogger<MapConfigController> _logger;

        public InformativeController(ILogger<MapConfigController> logger)
        {
            _logger = logger;
        }

        /// <response code="200">Return all available documents</response>
        /// <response code="500">Internal Server Error</response>
        /// <returns>List of string</returns>
        [HttpGet]
        [Route("list")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Informative/DocumentHandler" })]
        public ActionResult<IEnumerable<string>> GetDocumentList()
        {
            var documentList = new List<string>();

            try
            {
                documentList = InformativeHandler.GetDocumentList().ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, documentList);
        }

        /// <param name="name">Name of the map for which connected documents will be returned</param>
        /// <response code="200">Return available documents for the specified map</response>
        /// <response code="500">Internal Server Error</response>
        /// <returns>List of string</returns>
        [HttpGet]
        [Route("list/{name}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Informative/DocumentHandler" })]
        public ActionResult<IEnumerable<string>> GetDocumentList(string name)
        {
            var documentList = new List<string>();

            try
            {
                documentList = InformativeHandler.GetDocumentList(name).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, documentList);
        }

        /// <param name="name">Name of the document to be fetched</param>
        /// <response code="200">Return the JSON file</response>
        /// <response code="500">Internal Server Error</response>
        /// <returns>JsonObject</returns>
        [HttpGet]
        [Route("load/{name}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Client-accessible" })]
        public ActionResult<JsonObject> GetDocument(string name)
        {
            var document = new JsonObject();

            try
            {
                document = InformativeHandler.GetDocument(name);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, document);
        }
    }
}
