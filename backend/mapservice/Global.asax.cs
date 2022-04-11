using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Routing;
using log4net;

namespace MapService
{
    public class WebApiApplication : System.Web.HttpApplication
    {		
		protected void Application_Start()
        {
            log4net.Config.XmlConfigurator.Configure();
            GlobalConfiguration.Configure(WebApiConfig.Register);
			RouteConfig.RegisterRoutes(RouteTable.Routes);
#if !DISABLE_CORS_IN_CODE // To disable CORS Headers, add DISABLE_CORS_IN_CODE at Project mapservice->Properties->Build->Conditional compilation symbols
            ILog _log = LogManager.GetLogger(typeof(WebApiApplication));
            _log.Debug("CORS Headers using application code is ENABLED!");
#else
            ILog _log = LogManager.GetLogger(typeof(WebApiApplication));
            _log.Debug("CORS Headers using application code is DISABLED!");
#endif
        }

        protected void Application_End()
        {
            Controllers.EdpController.CloseEdpConnections(); // This method does nothing if EDP integration is not used!
        }
    }
}
