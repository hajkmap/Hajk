using MapService.Business.FmeProxy;
using MapService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using Swashbuckle.AspNetCore.Annotations;
using MapService.Utility;
using System.Buffers;
using System.IO.Pipelines;
using System.Net;

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
        [HttpGet]
        [HttpPost]
        [HttpPut]
        [HttpDelete]
        [HttpPatch]
        public async Task<IActionResult> SendQueryToFmeServerAPI(string query)
        {
            HttpResponseMessage response = new HttpResponseMessage();

            if (string.IsNullOrEmpty(query))
            {
                _logger.LogWarning("Not allowed to call proxy with empty query");
                response.StatusCode = (HttpStatusCode)StatusCodes.Status400BadRequest;
            }

            try
            {
                response = await FmeProxyHandler.SendQueryToFmeServerAPI(Request, query);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HttpRequestException");
                HttpStatusCode statusCode = (HttpStatusCode)(ex.StatusCode == null ? (HttpStatusCode)StatusCodes.Status500InternalServerError : ex.StatusCode);
                response.StatusCode = statusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");
                response.StatusCode = (HttpStatusCode)StatusCodes.Status500InternalServerError;
            }

            return new ProxyResponseUtility(response);
        }
    }
}