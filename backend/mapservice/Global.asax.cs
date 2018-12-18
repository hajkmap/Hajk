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
		}
    }
}
