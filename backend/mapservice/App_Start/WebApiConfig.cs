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
			// Web API configuration and services			
			config.EnableCors(new EnableCorsAttribute("http://localhost:3000", headers: "*", methods: "*"));
			config.EnableCors(new EnableCorsAttribute("http://localhost:3001", headers: "*", methods: "*"));			

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
