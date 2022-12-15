using System.Text;
using System.Net.Http.Headers;
using MapService.Utility;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http.Headers;

namespace MapService.Business.FmeProxy
{
    public static class FmeProxyHandler
    {
        static readonly HttpClient client = new HttpClient();

        public static async Task<HttpResponseMessage> SendQueryToFmeServerAPI(HttpRequest incomingRequest, string urlPath)
        {
            //Temporary solution
            urlPath = urlPath.Replace("%2F", "/");

            //Get server settings
            var fmeServerHost = ConfigurationUtility.GetSectionItem("FmeProxy:FmeServerBaseUrl");
            var fmeServerUser = ConfigurationUtility.GetSectionItem("FmeProxy:FmeServerUser");
            var fmeServerPwd = ConfigurationUtility.GetSectionItem("FmeProxy:FmeServerPassword");

            //Create request
            client.DefaultRequestHeaders.Accept.Clear();
            //client.DefaultRequestHeaders.Add("Authorization", "Basic " + Convert.ToBase64String(Encoding.UTF8.GetBytes(fmeServerUser + ":" + fmeServerPwd)).ToString());
            
            string url = fmeServerHost.EndsWith("/") ? fmeServerHost + urlPath : fmeServerHost + "/" + urlPath;

            var queryString = incomingRequest.QueryString.ToString();
            if (!string.IsNullOrEmpty(queryString))
                url += queryString;

            HttpRequestMessage request = new HttpRequestMessage(new HttpMethod(incomingRequest.Method), url);

            //If needed, set request body and headers
            if (new HttpMethod(incomingRequest.Method) != HttpMethod.Get)
            {
                //Body
                StreamReader bodyStreamReader = new StreamReader(incomingRequest.Body);
                string body = await bodyStreamReader.ReadToEndAsync();
                request.Content = new StringContent(body);
                
                //Headers
                /*if (incomingRequest.ContentType != null)
                {
                    request.Content.Headers.ContentType = new MediaTypeHeaderValue(incomingRequest.ContentType);
                }
                request.Content.Headers.ContentLength = incomingRequest.ContentLength;*/

                var incomingHeaders = incomingRequest.Headers.GetEnumerator();
                request.Headers.Clear();
                request.Content.Headers.Clear();
                while (incomingHeaders.MoveNext())
                {
                    var header = incomingHeaders.Current;

                    //Try add as request header 
                    var headerAdded = request.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());

                    //If not succesful try add as content header
                    if (!headerAdded)
                        request.Content.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());

                    //If it could not be added to either, the header will not be included in the request
                }

            }
            
            //Get Response
            var response = await client.SendAsync(request);
            response.EnsureSuccessStatusCode(); //throws HttpRequestException if other than status code 200 is returned

            //Return content as string
            return response;
        }

    }
}