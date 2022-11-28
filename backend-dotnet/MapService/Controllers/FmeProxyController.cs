using MapService.Business.FmeProxy;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System;
using System.Threading.Tasks;

namespace MapService.Controllers
{
    [Route("fmeproxy")]
    [Produces("application/json")]
    [ApiController]
    public class FmeProxyController : ControllerBase
    {
        private readonly ILogger<ConfigController> _logger;
        private const int BUFFER_SIZE = 1024 * 1024;

        public FmeProxyController(ILogger<ConfigController> logger)
        {
            _logger = logger;
        }

        ///<remarks>Proxy the specified query to FME-server REST API. For information on available endpoints, checkout the FME-server API documentation. The proxy will forward all HTTP-methods, not only GET.</remarks>
        /// <param query="query">Path corresponding to an endpoint on the FME-server REST API.</param>
        /// <response code="200">Result will vary depending on response from the API.</response>
        /// <response code="500">Internal Server Error</response>
        [Route("{query}")]
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status405MethodNotAllowed)]
        [SwaggerOperation(Tags = new[] { "FME-server Proxy" })]
        public async Task<ActionResult<string>> SendQueryToFmeServerAPI(string query)
        {
            string responseBody;
            
            if (string.IsNullOrEmpty(query))
            {
                _logger.LogWarning("Not allowed to call proxy with empty url");
                return StatusCode(StatusCodes.Status400BadRequest, "Not allowed to call proxy with empty query");
            }

            //From old backend, should be removed to support all request methods?
            if (Request.Method != "POST" && Request.Method != "GET")
            {
                _logger.LogWarning(string.Format("EndPoint called with not supported HTTP method: {0}", Request.Method));
                return StatusCode(StatusCodes.Status405MethodNotAllowed, "Not supported HTTP method");
            }
            
            try
            {
                responseBody = await FmeProxyHandler.SendQueryToFmeServerAPI(Request, query);

            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HttpRequestException");
                var statusCode = ex.StatusCode == null ? StatusCodes.Status500InternalServerError : ((int)ex.StatusCode);
                return StatusCode(statusCode, ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }
                        
            return StatusCode(((int)Response.StatusCode), responseBody);
        }
    }
}