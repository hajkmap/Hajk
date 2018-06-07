using System;
using System.IO;
using System.Text;
using System.Web;
using System.Web.Hosting;
using System.Web.Mvc;
using System.Collections.Generic;
using Newtonsoft.Json;
using MapService.Models;
using MapService.Models.ToolOptions;
using log4net;
using MapService.Components;
using System.Configuration;
using Newtonsoft.Json.Linq;
using MapService.DataAccess;
using System.Collections;
using System.Security.Principal;
using System.Net;

namespace MapService.Controllers
{
    public class FirController : Controller
    {
        ILog _log = LogManager.GetLogger(typeof(FirController));
        //private readonly SettingsDbContext settingsDataContext = new SettingsDbContext();

        [HttpGet]
        public string PropertyDoc(string id)
        {
            try
            {
                Response.Expires = 0;
                Response.ExpiresAbsolute = DateTime.Now.AddDays(-1);
                Response.Headers.Add("Cache-Control", "private, no-cache");

                CookieContainer myContainer = new CookieContainer();
                string url = string.Format(ConfigurationManager.AppSettings["firLMUrlServiceFastighet"] +"{0}?includeData=basinformation&srid=3007", id);
                var request = (HttpWebRequest)WebRequest.Create(url);
                request.Credentials = new NetworkCredential(ConfigurationManager.AppSettings["firLMServiceUser"], ConfigurationManager.AppSettings["firLMServicePassword"]);
                request.CookieContainer = myContainer;
                request.PreAuthenticate = true;
                request.Method = "GET";
                request.Timeout = 20000;

                using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                {
                    using (var stream = new StreamReader(response.GetResponseStream()))
                    {
                        JToken fastighet = JsonConvert.DeserializeObject<JToken>(stream.ReadToEnd());
                        var uuid = fastighet.SelectToken("$.features[0].id");

                        if (uuid != null)
                        {
                            Response.Redirect(string.Format(ConfigurationManager.AppSettings["firUrlServicePropertyDoc"], uuid.ToString()), true);
                        }

                        return string.Format("Kan inte visa fastighetsrapport för {0}", id);
                    }
                }
            }
            catch (Exception e)
            {
                _log.FatalFormat("Can't get property document: {0}", e);
                throw e;
            }
        }
    }
}
