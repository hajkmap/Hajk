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
        private string data = "";

        public MyActionResult(string data)
        {
            this.data = data;
        }

        public override void ExecuteResult(ControllerContext context)
        {
            //context.HttpContext.Response.Write(this.data);
        }
    }

    public class ProxyController : Controller
    {
        ILog _log = LogManager.GetLogger(typeof(MyActionResult));
        // Static -> only read once from Web.config
        static private List<string> _authorizedInternetDomains;
        static private string _headerAttributeName;
        static private int _removeDomainFromUserName = -1; // -1 = not initialized from Web.config. 0 = Do not remove, 1 = Remove

        // TODO: This needs refactornig for performance reasons. We should read config ONCE and save value. Something to put in constructor()?
        private bool IsAuthorizedInternetDomain(string url)
        {
            if(_authorizedInternetDomains == null) 
            {
                string confSetting = ConfigurationManager.AppSettings["authorizedInternetDomains"] == null ? "" : ConfigurationManager.AppSettings["authorizedInternetDomains"];
                _log.DebugFormat("authorizedInternetDomains: {0}", confSetting);
                _authorizedInternetDomains = new List<string>(confSetting.Split(','));
            }
            Uri uriUrl = new Uri(url);

            bool ret = _authorizedInternetDomains.Contains(uriUrl.Authority);
            if (!ret)
                _log.DebugFormat("No authorized domain (authority) found: {0}", url);
            return ret;
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

        private async Task GetPageContent(string url)
        {
            try
            {
                 _log.DebugFormat("url: {0}", url);

                if (!url.StartsWith("http:/") &&
                    !url.StartsWith("https:/"))
                {
                    url = "http:/" + url;
                }

                if (url.StartsWith("http:/"))
                {
                    url = url.Replace("http:/", "http://");
                }

                if (url.StartsWith("https:/"))
                {
                    url = url.Replace("https:/", "https://");
                }

                if (url.EndsWith("/?"))
                {
                    url = url.Replace("/?", "");
                }

                HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
                request.CookieContainer = new CookieContainer();
                request.UseDefaultCredentials = true;
                request.Method = "GET";

                if(!string.IsNullOrWhiteSpace(ConfigurationManager.AppSettings["authorizedInternetDomains"]) && !IsAuthorizedInternetDomain(url))
                {
                    throw new Exception("Domain not allowed in proxy");
                }
   

                if (User.Identity.IsAuthenticated) // Add HTTP Header of authenticated user
                {
                    _log.DebugFormat("User(in): {0}", User.Identity.Name);
                    if (IsAuthorizedInternetDomain(url)) // Only add header for authorized domains
                    {
                        string userName = GetUserNameForHeader(User.Identity.Name);
                        _log.DebugFormat("User(out): {0}", userName);

                        string headerAttributeName = GetHeaderAttributeName();
                        _log.DebugFormat("HeaderAttributeName: {0}", headerAttributeName);

                        request.Headers.Add(headerAttributeName, userName);
                    }
                }

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
                                    if (Response.ContentType == "application/vnd.ogc.wms_xml")
                                    {
                                        Response.ContentType = "text/xml";
                                    }
                                    else
                                    {
                                        Response.ContentType = resp.ContentType;
                                    }
                                }
                            }
                        }
                    }
                    catch(WebException e)
                    {                       
                        _log.WarnFormat("Exception in GetPageContent: Status: {0}, Message: {1}", e.Status, e.Message);
                        // TODO: May send a different statusCode and message to client
                        Response.StatusCode = 500;
                        Response.StatusDescription = e.Message;
                    }
                }
            }
            catch(Exception e)
            {
                _log.FatalFormat("Exception in GetPageContent: {0}", e.Message);
                throw e;
            }
        }

        private string postXMLData(string url, string requestXml)
        {
            try
            {
                _log.DebugFormat("url: {0}", url);

                if (!url.StartsWith("http://"))
                {
                    url = "http://" + url;
                }
                HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
                byte[] bytes;
                bytes = System.Text.Encoding.UTF8.GetBytes(requestXml);
                request.ContentType = "text/xml; encoding='utf-8'";
                request.ContentLength = bytes.Length;
                request.Method = "POST";
                request.UseDefaultCredentials = true;

                Stream requestStream = request.GetRequestStream();
                requestStream.Write(bytes, 0, bytes.Length);
                requestStream.Close();
                HttpWebResponse response;
                response = (HttpWebResponse)request.GetResponse();
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    Stream responseStream = response.GetResponseStream();
                    string responseStr = new StreamReader(responseStream).ReadToEnd();
                    return responseStr;
                }
                return null;

            }
            catch (Exception e)
            {
                _log.FatalFormat("Exception in postXMLData: {0}", e.Message);
                throw e;
            }
        }


        [HttpGet]
        public async Task<MyActionResult> GetUrl(string url)
        {
            await this.GetPageContent(String.Format("{0}?{1}", url, Request.QueryString));            
            return new MyActionResult("");
        }

        public class PostModel
        {
            public string body { get; set; }
        }

        [HttpPost]
        public string PostUrl(string url, PostModel model)        
        {            
            var data = model.body;
            return postXMLData(url, data);
        }
    }
}