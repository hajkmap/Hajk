using System.Text;
using System.Net.Http.Headers;
using MapService.Utility;
using System.Text.RegularExpressions;

namespace MapService.Business.FmeProxy
{
    public static class FmeProxyHandler
    {
        static readonly HttpClient client = new HttpClient();

        public static async Task<string> SendQueryToFmeServerAPI(HttpRequest incomingRequest, string urlPath)
        {
            //Better way to handle this?
            urlPath = urlPath.Replace("%2F", "/");

            //Get server settings
            var fmeServerHost = ConfigurationUtility.GetSectionItem("FmeProxy:FmeServerBaseUrl");
            var fmeServerUser = ConfigurationUtility.GetSectionItem("FmeProxy:FmeServerUser");
            var fmeServerPwd = ConfigurationUtility.GetSectionItem("FmeProxy:FmeServerPassword");

            //Create request
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Add("Authorization", "Basic " + Convert.ToBase64String(Encoding.UTF8.GetBytes(fmeServerUser + ":" + fmeServerPwd)).ToString());
                        
            string url = fmeServerHost.EndsWith("/") ? fmeServerHost + urlPath : fmeServerHost + "/" + urlPath;

            var queryString = incomingRequest.QueryString.ToString();
            if (!string.IsNullOrEmpty(queryString))
                url += queryString;

            HttpRequestMessage request = new HttpRequestMessage(new HttpMethod(incomingRequest.Method), url);

            //If needed, set request body and headers
            var contentEncoding = incomingRequest.Headers.ContentEncoding;
            if (new HttpMethod(incomingRequest.Method) != HttpMethod.Get)
            {
                StreamReader bodyStreamReader = new StreamReader(incomingRequest.Body);
                string body = await bodyStreamReader.ReadToEndAsync();
                request.Content = new StringContent(body);
                if (incomingRequest.ContentType != null) 
                { 
                    request.Content.Headers.ContentType = 
                        new MediaTypeHeaderValue(incomingRequest.ContentType); 
                }
                request.Content.Headers.ContentLength = incomingRequest.ContentLength;
            }

            //Get Response
            var response = await client.SendAsync(request);
            response.EnsureSuccessStatusCode(); //throws HttpRequestException if other than status code 200 is returned

            //Return content as string
            return await response.Content.ReadAsStringAsync();
        }
    }
}