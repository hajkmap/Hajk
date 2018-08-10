using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Hosting;
using System.Web.Http;
using System.Web.Mvc;

namespace MapService.Controllers
{
    public class InformativeController : Controller
    {
		[System.Web.Http.HttpGet]
		public string Load(string id)
        {			
			Response.Expires = 0;
			Response.ExpiresAbsolute = DateTime.Now.AddDays(-1);
			Response.ContentType = "application/json; charset=utf-8";
			Response.Headers.Add("Cache-Control", "private, no-cache");

			string file = String.Format("{0}App_Data\\{1}.json", HostingEnvironment.ApplicationPhysicalPath, id);
			if (System.IO.File.Exists(file))
			{
				return System.IO.File.ReadAllText(file);
			}
			return "File not found";
        }
		[System.Web.Http.HttpPost]
		public string Save(string id)
		{			
			Stream req = Request.InputStream;
			req.Seek(0, System.IO.SeekOrigin.Begin);
			string json = new StreamReader(req).ReadToEnd();
			string file = String.Format("{0}App_Data\\{1}.json", HostingEnvironment.ApplicationPhysicalPath, id);						
			if (System.IO.File.Exists(file))
			{
				System.IO.File.WriteAllText(file, json);
				return "File saved";
			}			
			return "File not found";
		}
	}
}