using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;

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

            response.StatusCode = (int)_responseMessage.StatusCode;

            //Headers
            foreach (var header in _responseMessage.Content.Headers)
            {
                if (!response.Headers.ContainsKey(header.Key))
                    response.Headers.Append(header.Key, new StringValues(header.Value.FirstOrDefault<string>()));
                else
                    response.Headers[header.Key.ToString()] = header.Value.FirstOrDefault<string>();
            }

            foreach (var header in _responseMessage.Headers)
            {
                if (!response.Headers.ContainsKey(header.Key))
                    response.Headers.Append(header.Key, new StringValues(header.Value.FirstOrDefault<string>()));
                else
                    response.Headers[header.Key.ToString()] = header.Value.FirstOrDefault<string>();
            }

            //Body
            const int BUFFER_SIZE = 1024 * 1024;
            var responseStream = await _responseMessage.Content.ReadAsStreamAsync();
            var bytes = new byte[BUFFER_SIZE];
            while (true)
            {
                var n = responseStream.Read(bytes, 0, BUFFER_SIZE);
                if (n == 0)
                    break;

                var test = await response.BodyWriter.WriteAsync(bytes);
            }

        }
    }
}
