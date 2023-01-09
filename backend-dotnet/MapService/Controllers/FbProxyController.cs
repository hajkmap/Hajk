using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using MapService.Utility;
using System.Net;
using MapService.Business.FbProxy;

namespace MapService.Controllers
{
    public class FbProxyController : ControllerBase
    {
        private readonly ILogger<FbProxyController> _logger;

        public FbProxyController(ILogger<FbProxyController> logger)
        {
            _logger = logger;
        }

        ///<remarks>Proxy the specified query to Sokigo's FB API</remarks>
        /// <param query="query">The query to be proxied</param>
        /// <response code="200">Result will vary depending on response from the API.</response>
        [Route("{*query}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Sokigo FB Proxy" })]
        [HttpGet]
        [HttpPost]
        [HttpPut]
        [HttpDelete]
        [HttpPatch]
        public async Task<IActionResult> SendQueryToFbAPI(string query)
        {
            HttpResponseMessage response = new HttpResponseMessage();

            if (string.IsNullOrEmpty(query))
            {
                _logger.LogWarning("Not allowed to call proxy with empty query");
                response.StatusCode = (HttpStatusCode)StatusCodes.Status400BadRequest;
            }

            try
            {
                response = await FbProxyHandler.SendQueryToFbAPI(Request, query);
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
