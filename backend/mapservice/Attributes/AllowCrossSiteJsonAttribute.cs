using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace MapService.Attributes
{
	public class CORSActionFilter : ActionFilterAttribute
	{
#if !DISABLE_CORS_IN_CODE
		public override void OnActionExecuting(ActionExecutingContext filterContext)
		{
            filterContext.RequestContext.HttpContext.Response.AddHeader("Access-Control-Allow-Origin", "*");
            filterContext.RequestContext.HttpContext.Response.AddHeader("Access-Control-Allow-Headers", "*");
            filterContext.RequestContext.HttpContext.Response.AddHeader("Access-Control-Allow-Credentials", "true");

            if (filterContext.HttpContext.Request.HttpMethod == "OPTIONS")
			{				
				filterContext.Result = new EmptyResult();
			}
			else
			{
				base.OnActionExecuting(filterContext);
			}
		}
#endif
	}
}