using MapService.Business;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace MapService.Controllers
{
    [Route("")]
    [Produces("text/plain")]
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