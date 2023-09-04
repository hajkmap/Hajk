using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using System.Net;

namespace MapService.Utility
{
    public class ProxyResponseUtility : IActionResult
    {
        private readonly HttpResponseMessage _responseMessage;

        public ProxyResponseUtility(HttpResponseMessage responseMessage)
        {
            _responseMessage = responseMessage;
        }

        public async Task ExecuteResultAsync(ActionContext context)
        {
            var response = context.HttpContext.Response;
            try
            {
                response.StatusCode = (int)_responseMessage.StatusCode;

                //Headers
                response.Headers.Clear();
                foreach (var header in _responseMessage.Content.Headers)
                {
                    response.Headers.Append(header.Key, header.Value.ToArray());
                }

                foreach (var header in _responseMessage.Headers)
                {
                    response.Headers.Append(header.Key, header.Value.ToArray());
                }

                //Body
                await _responseMessage.Content.CopyToAsync(response.Body);
            }
            catch (Exception ex)
            {
                response.StatusCode = StatusCodes.Status500InternalServerError;
            }
            
        }
    }
}
