using System;
using System.ServiceModel.Activation;
using System.Web;
using System.Web.Routing;

namespace Sweco.Services
{
    public class Global : System.Web.HttpApplication
    {        
        protected void Application_BeginRequest(object sender, EventArgs e)
        {
            HttpContext.Current.Response.AddHeader("Access-Control-Allow-Origin", "http://localhost");
            if (HttpContext.Current.Request.HttpMethod == "OPTIONS")
            {
                HttpContext.Current.Response.AddHeader("Access-Control-Allow-Methods", "POST, PUT, DELETE");
                HttpContext.Current.Response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
                HttpContext.Current.Response.AddHeader("Access-Control-Max-Age", "1728000");
                HttpContext.Current.Response.End();
            }
        }

        protected void Application_Start(object sender, EventArgs e)
        {            
            RouteTable.Routes.Add(new ServiceRoute("settings", new WebServiceHostFactory(), typeof(SettingsService)));
            RouteTable.Routes.Add(new ServiceRoute("export", new WebServiceHostFactory(), typeof(ExportService)));
        }

        protected void Application_End(object sender, EventArgs e)
        {

        }
    }
}