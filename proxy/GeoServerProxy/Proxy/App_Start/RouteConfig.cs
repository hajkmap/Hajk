using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace Proxy
{
    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            //routes.MapRoute(
            //    name: "Default",
            //    url: "{controller}/{action}/{*url}",
            //    defaults: new { controller = "GeoServer", action = "GetUrl", url = UrlParameter.Optional }
            //);

            // Funkar för GetMap och GetCapabilities
            // Funkar INTE för GeoServer Web interface (Admin)
            routes.MapRoute(
                name: "Default",
                url: "GeoServer/{*url}",
                defaults: new { controller = "GeoServer", action = "EndPoint", url = UrlParameter.Optional }
            );
        }
    }
}
