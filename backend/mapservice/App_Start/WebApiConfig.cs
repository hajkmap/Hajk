using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using log4net;

namespace MapService
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            // Test av log4net
          //  ILog _log = LogManager.GetLogger(typeof(WebApiConfig));
          //  _log.ErrorFormat("Test av log4net av {0}", "Hitomi");


            // Web API configuration and services

            // Web API routes
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "settings/{controller}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );            
        }
    }
}
