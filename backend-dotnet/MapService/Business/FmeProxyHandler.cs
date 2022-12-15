using System.Text;
using System.Net.Http.Headers;
using MapService.Utility;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http.Headers;
using System.Web;

namespace MapService.Business.FmeProxy
{
    public static class FmeProxyHandler
    {
        static readonly HttpClient client = new HttpClient();

        public static async Task<HttpResponseMessage> SendQueryToFmeServerAPI(HttpRequest incomingRequest, string urlPath)
        {
            urlPath = HttpUtility.UrlDecode(urlPath);

            //Get server settings
            var fmeServerHost = ConfigurationUtility.GetSectionItem("FmeProxy:FmeServerBaseUrl");
            var fmeServerUser = ConfigurationUtility.GetSectionItem("FmeProxy:FmeServerUser");
            var fmeServerPwd = ConfigurationUtility.GetSectionItem("FmeProxy:FmeServerPassword");

            string url = fmeServerHost.EndsWith("/") ? fmeServerHost + urlPath : fmeServerHost + "/" + urlPath;

            //Create request
            var queryString = incomingRequest.QueryString.ToString();
            if (!string.IsNullOrEmpty(queryString))
                url += queryString;

            HttpRequestMessage request = new HttpRequestMessage(new HttpMethod(incomingRequest.Method), url);
            request.Headers.Add("Authorization", Convert.ToBase64String(Encoding.UTF8.GetBytes(fmeServerUser + ":" + fmeServerPwd)).ToString());
            
            //If needed, set request body and headers
            if (new HttpMethod(incomingRequest.Method) != HttpMethod.Get)
            {
                //Body
                StreamReader bodyStreamReader = new StreamReader(incomingRequest.Body);
                string body = await bodyStreamReader.ReadToEndAsync();
                request.Content = new StringContent(body);
                
                //Headers
                if (incomingRequest.ContentType != null)
                {
                    request.Content.Headers.ContentType = new MediaTypeHeaderValue(incomingRequest.ContentType);
                }
                request.Content.Headers.ContentLength = incomingRequest.ContentLength;

            }
            
            //Get Response
            var response = await client.SendAsync(request);
            response.EnsureSuccessStatusCode(); //Throws HttpRequestException if other than status code 200 is returned

            return response;
        }

    }
}