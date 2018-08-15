using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace MapService.Attributes
{
	public class CORSActionFilter : ActionFilterAttribute
	{
		public override void OnActionExecuting(ActionExecutingContext filterContext)
		{
			if (filterContext.HttpContext.Request.HttpMethod == "OPTIONS")
			{				
				filterContext.Result = new EmptyResult();
			}
			else
			{
				base.OnActionExecuting(filterContext);
			}
		}
	}
}