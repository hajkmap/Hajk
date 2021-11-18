using System;
using System.IO;
using System.Text;
using System.Web.Mvc;
using log4net;
using System.Configuration;
using System.Net;
using System.Threading.Tasks;

/// <summary>
/// Controller that proxies requests to FME Server.
/// 
/// You have to add these settings in Web.config in section <appSettings>
///    <add key="fmeServerHost" value="https://fmeserver.varberg.se/" />
///    <add key="fmeServerUser" value="geodatabanken" />
///    <add key="fmeServerPwd" value="****" />
/// </summary>

namespace MapService.Controllers
{
    public class MyActionResult : ActionResult
    {
        public override void ExecuteResult(ControllerContext context)
        {
        }
    }

    public class FmeProxyController : Controller
    {
        ILog _log = LogManager.GetLogger(typeof(FmeProxyController));

        private string GetFmeServerHost()
        {
            return ConfigurationManager.AppSettings["fmeServerHost"];
        }

        private string GetFmeServerUser()
        {
            return ConfigurationManager.AppSettings["fmeServerUser"];
        }

        private string GetFmeServerPwd()
        {
            return ConfigurationManager.AppSettings["fmeServerPwd"];
        }

        private async Task DoMethod(string method, string urlPath, string queryString, string body, string contentType, Encoding contentEncoding)
        {
            try
            {
                _log.DebugFormat("DoMethod incomig method: {0}, urlPath: {1}, queryString, {2}, body: {3}", method, urlPath, queryString, body);

                string url = GetFmeServerHost().EndsWith("/") ? GetFmeServerHost() + urlPath : GetFmeServerHost() + "/" + urlPath;
                if (!string.IsNullOrEmpty(queryString))
                    url = url + "?" + queryString;
                _log.DebugFormat("DoMethod outgoing url: {0}", url);

                HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
                request.CookieContainer = new CookieContainer();
                request.UseDefaultCredentials = true;
                request.Method = method;

                request.Headers.Add("Authorization", "Basic " + Convert.ToBase64String(Encoding.UTF8.GetBytes(GetFmeServerUser() + ":" + GetFmeServerPwd())).ToString());

                if (method == "POST")
                {
                    byte[] bodyAsBytes;
                    bodyAsBytes = contentEncoding.GetBytes(body);
                    request.ContentType = contentType + "; encoding=" + contentEncoding.HeaderName;// 'utf-8'";
                    request.ContentLength = bodyAsBytes.Length;

                    Stream requestStream = request.GetRequestStream();
                    requestStream.Write(bodyAsBytes, 0, bodyAsBytes.Length);
                    requestStream.Close();
                }

                await this.HandleResponse(request);
            }
            catch (Exception e)
            {
                _log.FatalFormat("Exception in DoMethod: {0}", e.Message);
                throw e;
            }
        }

        private async Task HandleResponse(HttpWebRequest request)
        {
            const int BUFFER_SIZE = 1024 * 1024;

            if (request != null)
            {
                try
                {
                    using (var resp = await request.GetResponseAsync())
                    {
                        using (var stream = resp.GetResponseStream())
                        {
                            var bytes = new byte[BUFFER_SIZE];
                            while (true)
                            {
                                var n = stream.Read(bytes, 0, BUFFER_SIZE);
                                if (n == 0)
                                    break;
                                Response.OutputStream.Write(bytes, 0, n);
                                Response.ContentType = resp.ContentType;
                            }
                        }
                    }
                }
                catch (WebException e)
                {
                    _log.WarnFormat("Exception in HandleResponse: Status: {0}, Message: {1}", e.Status, e.Message);
                    Response.StatusCode = GetHttpStatusCode(e);
                    Response.StatusDescription = e.Message;
                }
            }
        }

        private int GetHttpStatusCode(WebException ex)
        {
            var response = ex.Response as HttpWebResponse;
            if (response != null)
            {
                return (int)response.StatusCode;
            }

            return 500;
        }

        /// <summary>
        /// Handle all HTTP-methods
        /// </summary>
        /// <param name="url"></param>
        public async Task<MyActionResult> EndPoint(string url)
        {
            _log.DebugFormat("EndPoint called with url: {0}", url);

            if (string.IsNullOrEmpty(url))
            {
                _log.Warn("Not allowed to call proxy with empty url");
                Response.StatusCode = 400;
                Response.StatusDescription = "Not allowed to call proxy with empty url";
            }

            if (Request.HttpMethod != "GET" && Request.HttpMethod != "POST")
            {
                _log.WarnFormat("EndPoint called with not supported HTTP method: {0}", Request.HttpMethod);
                Response.StatusCode = 405;
                Response.StatusDescription = "Not supported HTTP method";
            }
            else
            {
                var contentType = Request.ContentType;
                var contentEncoding = Request.ContentEncoding;
                string body = "";

                if (Request.HttpMethod == "POST")
                {
                    using (Stream receiveStream = Request.InputStream)
                    {
                        using (StreamReader readStream = new StreamReader(receiveStream, Request.ContentEncoding))
                        {
                            body = readStream.ReadToEnd();
                        }
                    }
                }
                await this.DoMethod(Request.HttpMethod, url, Request.QueryString.ToString(), body, contentType, contentEncoding);
            }
            return new MyActionResult();
        }
    }
}
