using MapService.Business.Informative;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

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

        /// <remarks>
        /// Return all available documents
        /// </remarks>
        /// <response code="200">All layers were fetched successfully</response>
        /// <response code="500">Internal Server Error</response>
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
    }
}
