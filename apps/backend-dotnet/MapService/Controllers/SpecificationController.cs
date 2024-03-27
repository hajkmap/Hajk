using MapService.Business;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace MapService.Controllers
{
    [Route("api/v{version:apiVersion}")]
    [ApiVersion("1.0")]
    [ApiVersion("2.0")]
    [Produces("text/plain")]
    [ApiController]
    public class SpecificationController : ControllerBase
    {
        private readonly ILogger<SpecificationController> _logger;

        public SpecificationController(ILogger<SpecificationController> logger)
        {
            _logger = logger;
        }

        /// <remarks>
        /// Return the API specification
        /// </remarks>
        /// <response code="200">Return the API specification</response>
        /// <response code="500">Internal Server Error</response>
        [HttpGet]
        [Route("spec")]
        [MapToApiVersion("2.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Specification" })]
        public ActionResult<string> GetSpecification()
        {
            string openApiSpecification;

            try
            {
                openApiSpecification = SpecificationHandler.GetOpenApiSpecification();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, openApiSpecification);
        }
    }
}