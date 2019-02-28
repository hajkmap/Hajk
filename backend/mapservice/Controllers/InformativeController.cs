using MapService.Attributes;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
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
	class Document
	{
		public string map { get; set; }
		public object[] chapters { get; set; }
	}

    [CORSActionFilter]
    public class InformativeController : Controller
    {        
        [System.Web.Http.HttpGet]
		public string Load(string id)
        {			
			Response.Expires = 0;
			Response.ExpiresAbsolute = DateTime.Now.AddDays(-1);
			Response.ContentType = "application/json; charset=utf-8";
			Response.Headers.Add("Cache-Control", "private, no-cache");

			string file = String.Format("{0}App_Data\\documents\\{1}.json", HostingEnvironment.ApplicationPhysicalPath, id);
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
			string file = String.Format("{0}App_Data\\documents\\{1}.json", HostingEnvironment.ApplicationPhysicalPath, id);						
			if (System.IO.File.Exists(file))
			{
				System.IO.File.WriteAllText(file, json);
				return "File saved";
			}			
			return "File not found";
		}
        
        [System.Web.Http.HttpPost]
		public string Create()
		{
			Stream req = Request.InputStream;
			req.Seek(0, System.IO.SeekOrigin.Begin);
			string json = new StreamReader(req).ReadToEnd();
			JObject formData = JObject.Parse(json);
			string documentName = (string)formData["documentName"];
			string mapName = (string)formData["mapName"];			
			string file = String.Format("{0}App_Data\\documents\\{1}.json", HostingEnvironment.ApplicationPhysicalPath, documentName);					
			json = "{\"chapters\": [], \"map\": \"" + mapName + "\"}";
			System.IO.File.WriteAllText(file, json);
			return "Document created";			
		}
        
        [System.Web.Http.HttpDelete]
		public string Delete(string id)
		{			
			string file = String.Format("{0}App_Data\\documents\\{1}.json", HostingEnvironment.ApplicationPhysicalPath, id);
			System.IO.File.Delete(file);
			return "Document deleted";
		}

        [CORSActionFilter]
        [System.Web.Http.HttpGet]
		public string List(string id)
		{
			Response.Expires = 0;
			Response.ExpiresAbsolute = DateTime.Now.AddDays(-1);
			Response.ContentType = "application/json; charset=utf-8";
			Response.Headers.Add("Cache-Control", "private, no-cache");
			string folder = String.Format("{0}App_Data\\documents\\", HostingEnvironment.ApplicationPhysicalPath);			
			if (Directory.Exists(folder))
			{
				string[] files = Directory.GetFiles(folder).Select(f => Path.GetFileNameWithoutExtension(f)).ToArray();				
				if (id == null)
				{
					return JsonConvert.SerializeObject(files);
				}
				else
				{
					string[] fileNames = Directory.GetFiles(folder).Select(f => Path.GetFullPath(f)).ToArray();
					List<string> documents = new List<string>();
					foreach (string fileName in fileNames)
					{						
						var text = System.IO.File.ReadAllText(fileName);
						Document d = JsonConvert.DeserializeObject<Document>(text);
						if (d.map == id)
						{
							documents.Add(Path.GetFileNameWithoutExtension(fileName));
						}
					}
					return JsonConvert.SerializeObject(documents);
				}
			}

			return "Folder not found";
		}
	}
}