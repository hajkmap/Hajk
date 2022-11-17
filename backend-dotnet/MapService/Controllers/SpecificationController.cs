using MapService.Business;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Text.Json.Nodes;

namespace MapService.Controllers
{
    [Route("")]
    [Produces("application/json")]
    [ApiController]
    public class SpecificationController : ControllerBase
    {
        private readonly ILogger<SpecificationController> _logger;

        public SpecificationController(ILogger<SpecificationController> logger)
        {
            _logger = logger;
        }

        /// <response code="200">Return the API specification</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("spec")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Specification" })]
        public ActionResult<IEnumerable<string>> GetSpecification()
        {
            JsonObject layerObject;

            try
            {
                layerObject = SpecificationHandler.GetSpecification();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, layerObject);
        }
    }
}