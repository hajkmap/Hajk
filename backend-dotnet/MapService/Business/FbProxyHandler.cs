using System.Net.Http.Headers;
using MapService.Utility;
using System.Web;

namespace MapService.Business.FbProxy
{
    public static class FbProxyHandler
    {
        static readonly HttpClient client = new HttpClient();

        public static async Task<HttpResponseMessage> SendQueryToFbAPI(HttpRequest incomingRequest, string urlPath)
        {
            urlPath = HttpUtility.UrlDecode(urlPath);

            //Get server settings
            var fbServiceHost = ConfigurationUtility.GetSectionItem("FbProxy:FbServiceBaseUrl");
            var fbServiceDb = ConfigurationUtility.GetSectionItem("FbProxy:FbServiceDatabase");
            var fbServiceUser = ConfigurationUtility.GetSectionItem("FbProxy:FbServiceUser");
            var fbServicePwd = ConfigurationUtility.GetSectionItem("FbProxy:FbServicePassword");

            string url = fbServiceHost.EndsWith("/") ? fbServiceHost + urlPath : fbServiceHost + "/" + urlPath;

            //Connection string
            url += String.Format("?Database={0}&User={1}&Password={2}", fbServiceDb, fbServiceUser, fbServicePwd);
            
            //Query string
            var queryString = incomingRequest.QueryString.ToString();
            queryString = queryString.Substring(queryString.IndexOf("?")+1);
            if (!string.IsNullOrEmpty(queryString))
                url += queryString;

            //Create request
            HttpRequestMessage request = new HttpRequestMessage(new HttpMethod(incomingRequest.Method), url);

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
