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
        private async Task GetPageContent(string url)
        {                    
            if (!url.StartsWith("http:/") && 
                !url.StartsWith("https:/"))
            {
                url = "http:/" + url;            
            }

            if (url.StartsWith("http:/")) {
                url = url.Replace("http:/", "http://");
            }

            if (url.StartsWith("https:/")) {
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
            
            if (User.Identity.IsAuthenticated)
                request.Headers.Add("X-Control-Header", User.Identity.Name);
            const int BUFFER_SIZE = 1024 * 1024;

            if (request != null)
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
        }

        private string postXMLData(string url, string requestXml)
        {
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