using MapService.Business.FmeProxy;
using MapService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using Swashbuckle.AspNetCore.Annotations;
using MapService.Utility;
using System.Buffers;
using System.IO.Pipelines;

namespace MapService.Controllers
{
    [Route("fmeproxy")]
    [ApiController]
    public class FmeProxyController : ControllerBase
    {
        private readonly ILogger<FmeProxyController> _logger;

        public FmeProxyController(ILogger<FmeProxyController> logger)
        {
            _logger = logger;
        }

        ///<remarks>Proxy the specified query to FME-server REST API. For information on available endpoints, checkout the FME-server API documentation. The proxy will forward all HTTP-methods, not only GET.</remarks>
        /// <param query="query">Path corresponding to an endpoint on the FME-server REST API.</param>
        /// <response code="200">Result will vary depending on response from the API.</response>
        /// <response code="500">Internal Server Error</response>
        [Route("{*query}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "FME-server Proxy" })]
        public async Task<IActionResult> SendQueryToFmeServerAPI(string query)
        {
            //string responseBody = "";
            HttpResponseMessage response = new HttpResponseMessage();

            if (string.IsNullOrEmpty(query))
            {
                _logger.LogWarning("Not allowed to call proxy with empty query");
                Response.StatusCode = StatusCodes.Status400BadRequest;
                //return StatusCode(StatusCodes.Status400BadRequest, "Not allowed to call proxy with empty query");
            }

            try
            {
                //responseBody = await FmeProxyHandler.SendQueryToFmeServerAPI(Request, query);
                response = await FmeProxyHandler.SendQueryToFmeServerAPI(Request, query);

            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HttpRequestException");
                var statusCode = ex.StatusCode == null ? StatusCodes.Status500InternalServerError : ((int)ex.StatusCode);
                //return StatusCode(statusCode, ex.Message);
                Response.StatusCode = statusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");
                Response.StatusCode = StatusCodes.Status500InternalServerError;
                //return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return new ProxyResponseUtility(response);
        }
    }
}