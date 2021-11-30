using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Security.Principal;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using System.Configuration;
using log4net;

namespace Proxy.Controllers
{
    public class MyActionResult : ActionResult
    {
        public override void ExecuteResult(ControllerContext context)
        {
        }
    }

    public class GeoServerController : Controller
    {
        ILog _log = LogManager.GetLogger(typeof(MyActionResult));
        // Static -> only read once from Web.config
        static private string _headerAttributeName, _localhostServer;
        static private int _removeDomainFromUserName = -1; // -1 = not initialized from Web.config. 0 = Do not remove, 1 = Remove

        private string GetlocalhostServer()
        {
            if (_localhostServer == null)
            {
                _localhostServer = ConfigurationManager.AppSettings["localhostServer"];
                if (_localhostServer == null)
                    throw new Exception("No \"localhostServer\" set in Web.config");
            }
            return _localhostServer;
        }

        private string GetUserNameForHeader(string userName)
        {
            if (_removeDomainFromUserName == -1)
                _removeDomainFromUserName = ConfigurationManager.AppSettings["removeDomainNameFromUser"] == null ? 0 : int.Parse(ConfigurationManager.AppSettings["removeDomainNameFromUser"]);
            if (_removeDomainFromUserName == 1)
            {
                int n = userName.IndexOf("\\");
                userName = userName.Substring(n < 0 ? 0 : n + 1);
            }
            return userName;
        }

        private string GetHeaderAttributeName()
        {
            if (_headerAttributeName == null)
            {
                _headerAttributeName = ConfigurationManager.AppSettings["headerAttributeName"];
                if (_headerAttributeName == null)
                {
                    _headerAttributeName = "X-Control-Header";
                    _log.DebugFormat("No config found in Web.config for 'headerAttributeName'. Using: {0}", _headerAttributeName);
                }
            }
            return _headerAttributeName;
        }

        private async Task DoMethod(string method, string urlPath, string queryString, string body, string contentType, Encoding contentEncoding)
        {
            try
            {
                _log.DebugFormat("DoMethod incomig method: {0}, urlPath: {1}, queryString, {2}, body: {3}", method, urlPath, queryString, body);

                string url = GetlocalhostServer() + urlPath;
                if (!string.IsNullOrEmpty(queryString))
                    url = url + "?" + queryString;
                _log.DebugFormat("DoMethod outgoing url: {0}", url);

                HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
                request.CookieContainer = new CookieContainer();
                request.UseDefaultCredentials = true;
                request.Method = method;

                if (User.Identity.IsAuthenticated) // Add HTTP Header of authenticated user
                {
                    _log.DebugFormat("User(in): {0}", User.Identity.Name);
                    string userName = GetUserNameForHeader(User.Identity.Name);
                    _log.DebugFormat("User(out): {0}", userName);

                    string headerAttributeName = GetHeaderAttributeName();
                    _log.DebugFormat("HeaderAttributeName: {0}", headerAttributeName);

                    request.Headers.Add(headerAttributeName, userName);
                }

                if (method == "POST")
                {
                    byte[] bodyAsBytes;
                    bodyAsBytes = contentEncoding.GetBytes(body);
                    request.ContentType = "text/xml; encoding=" + contentEncoding.HeaderName;// 'utf-8'";
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
                                {
                                    break;
                                }
                                Response.OutputStream.Write(bytes, 0, n);
                            }
                            if (Response.ContentType == "application/vnd.ogc.wms_xml")
                            {
                                Response.ContentType = "text/xml";
                            }
                            else
                            {
                                Response.ContentType = resp.ContentType;
                            }
                        }
                        // Copy GeoWebCache Headers
                        foreach (var headerName in resp.Headers.AllKeys)
                        {
                            if (headerName.StartsWith("geowebcache"))
                            {
                                Response.Headers.Add(headerName, resp.Headers[headerName]);
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
            _log.DebugFormat("EndPoint url: {0}", url);

            if(!string.IsNullOrEmpty(url) && url.StartsWith("web/"))
            {
                _log.Warn("Not allowed to use GeoServer Web-interface through proxy: {0}");
                Response.StatusCode = 400;
                Response.StatusDescription = "Not allowed to use GeoServer Web-interface";
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
