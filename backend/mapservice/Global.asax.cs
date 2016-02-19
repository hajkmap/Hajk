using System;
using System.ServiceModel.Activation;
using System.Web;
using System.Web.Routing;

namespace Sweco.Services
{
    public class Global : System.Web.HttpApplication
    {
        private static readonly log4net.ILog Logger = log4net.LogManager.GetLogger("WEB");

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
            log4net.Config.XmlConfigurator.Configure();

            try
            {
                Logger.DebugFormat("Laddar in tjänst: {0}", "settings");
                RouteTable.Routes.Add(new ServiceRoute("settings", new WebServiceHostFactory(), typeof(SettingsService)));
                Logger.DebugFormat("Laddar in tjänst: {0}", "export");
                RouteTable.Routes.Add(new ServiceRoute("export", new WebServiceHostFactory(), typeof(ExportService)));
            }
            catch (Exception ex)
            {
                Logger.FatalFormat("Undantag  kastades när tjänster skulle startas. En eller flera tjänster kan vara instabila. Undatag: {0}.", ex);
            }
        }

        protected void Application_End(object sender, EventArgs e)
        {

        }
    }
}