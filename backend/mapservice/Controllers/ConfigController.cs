using System;
using System.IO;
using System.Text;
using System.Web;
using System.Web.Hosting;
using System.Web.Mvc;
using System.Collections.Generic;
using Newtonsoft.Json;
using MapService.Models;
using MapService.Models.ToolOptions;

namespace MapService.Controllers
{
    public class ConfigController : Controller
    {
        public void Delete(string id)
        {
            string file = String.Format("{0}App_Data\\{1}.json", HostingEnvironment.ApplicationPhysicalPath, id);
            if (System.IO.File.Exists(file))
            {
                System.IO.File.Delete(file);                
            }
            else
            {
                throw new HttpException(404, "File not found");
            }
        }

        public void Create(string id)
        {
            string folder = String.Format("{0}App_Data", HostingEnvironment.ApplicationPhysicalPath);
            string file = String.Format("{0}\\{1}.json", folder, id);
            MapConfig mapConfig = new MapConfig()
            {
                map = new MapSetting()
                {
                    maxZoom = 3,
                    minZoom = 9,
                    zoom = 3,
                    projection = "EPSG:3006",
                    target = "map",
                    logo = "",
                    colors = new Colors()
                    {
                        primaryColor = "#1B78CC",
                        secondaryColor = "#FFF"
                    },
                    center = new int[] { 414962, 6583005 },
                    extent = new double[] { 150202, 6382100, 209944, 6471028 },
                    origin = new double[] { 0, 0 },
                    resolutions = new double[] {
                        4096.0,
                        2048.0,
                        1024.0,
                        512.0,
                        256.0,
                        128.0,
                        64.0,
                        32.0,
                        16.0,
                        8.0,
                        4.0,
                        2.0,
                        1.0,
                        0.5
                    }
                },
                projections = new List<Projection>()
                {
                    new Projection()
                    {
                        code = "EPSG:3006",
                        definition = "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
                        extent = new double[] { 181896.33, 6101648.07, 864416.0, 7689478.3 }
                    }
                },
                tools = new List<Tool>()
                {
                    new Tool()
                    {
                        type = "layerswitcher",
                        options = new LayerMenuOptions() {
                            baselayers = new List<string>(),
                            groups = new List<LayerGroup>()
                        }
                    }
                },
                version = "1.0.5"
            };            
            string jsonOutput = JsonConvert.SerializeObject(mapConfig, Formatting.Indented);                            
            System.IO.File.WriteAllText(file, jsonOutput);
        }

        public string List(string id)
        {
            Response.ContentType = "application/json; charset=utf-8";
            Response.Headers.Add("Cache-Control", "private, no-cache");

            string folder = String.Format("{0}App_Data", HostingEnvironment.ApplicationPhysicalPath);
            IEnumerable<string> files = Directory.EnumerateFiles(folder);
            List<string> fileList = new List<string>();
            foreach (string file in files)
            {
                string fileName = Path.GetFileNameWithoutExtension(file);
                if (fileName != "layers")
                {
                    fileList.Add(fileName);
                }
            }            
            return JsonConvert.SerializeObject(fileList);
        }

        public string GetConfig(string name)
        {
            Response.ContentType = "application/json; charset=utf-8";
            Response.Headers.Add("Cache-Control", "private, no-cache");

            if (name == null)
            {
                throw new HttpException(500, "File name is not present");
            }            

            if (name.ToLower() == "list")
            {
                return List("all");
            }            

            string file = String.Format("{0}App_Data\\{1}.json", HostingEnvironment.ApplicationPhysicalPath, name);

            if (System.IO.File.Exists(file))
            {
                return System.IO.File.ReadAllText(file);
            } else
            {
                throw new HttpException(404, "File not found");                
            }
        }
    }
}
