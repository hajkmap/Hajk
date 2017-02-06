using System;
using System.IO;
using System.Text;
using System.Web;
using System.Web.Hosting;
using System.Web.Mvc;

namespace MapService.Controllers
{
    public class ConfigController : Controller
    {        
        public string GetConfig(string name)
        {
            string file = String.Format("{0}App_Data\\{1}.json", HostingEnvironment.ApplicationPhysicalPath, name);
            if (System.IO.File.Exists(file))
            {
                string json_data = System.IO.File.ReadAllText(file);
                Response.ContentType = "application/json; charset=utf-8";
                Response.Headers.Add("Cache-Control", "private, no-cache");
                return json_data;
            } else
            {
                throw new HttpException(404, "File not found");                
            }
        }

        public string Layers()
        {
            string file = String.Format("{0}App_Data\\layers.json", HostingEnvironment.ApplicationPhysicalPath);
            if (System.IO.File.Exists(file))
            {
                string json_data = System.IO.File.ReadAllText(file);
                Response.ContentType = "application/json; charset=utf-8";
                Response.Headers.Add("Cache-Control", "private, no-cache");
                return json_data;
            }
            else
            {
                throw new HttpException(404, "File not found");
            }
        }
    }
}
