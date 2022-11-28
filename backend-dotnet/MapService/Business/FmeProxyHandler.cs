using Microsoft.AspNetCore.Mvc;
using System.Net;
using System;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using System.Net.Http.Headers;

namespace MapService.Business.FmeProxy
{
    public static class FmeProxyHandler
    {
        static readonly HttpClient client = new HttpClient();

        public static async Task<HttpResponseMessage> SendQueryToFmeServerAPI(HttpRequest incomingRequest, string urlPath)
        {
            //Just for testing purposes
            var fmeServerHost = "https://api.github.com";//"https://fmeserver.some.domain.com";
            var fmeServerUser = "someFmeUser";
            var fmeServerPwd = "aGreatPassword";
            urlPath = "orgs/dotnet/repos";
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github.v3+json"));
            client.DefaultRequestHeaders.Add("User-Agent", ".NET Foundation Repository Reporter");


            //Create request
            string url = fmeServerHost + "/" + urlPath;

            var queryString = incomingRequest.QueryString.ToString();
            if (!string.IsNullOrEmpty(queryString))
                url += "?" + queryString;

            HttpMethod method = new HttpMethod(incomingRequest.Method);
            HttpRequestMessage request = new HttpRequestMessage(method, url);
            
            //Get Response
            var response = await client.SendAsync(request);
            response.EnsureSuccessStatusCode(); //throws exception if not status code 200
            
            return response;
        }
    }
}