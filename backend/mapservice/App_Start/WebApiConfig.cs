using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Web.Http;
using System.Web.Http.Cors;
using log4net;

namespace MapService
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {            
            config.EnableCors();            
            config.MapHttpAttributeRoutes();
            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "settings/{controller}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );            
        }
    }
}
