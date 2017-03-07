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
                    },
                    new Projection()
                    {
                        code = "EPSG:3007",
                        definition = "+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
                        extent = new double[] { 60436.5084, 6192389.5650, 217643.4713, 6682784.4276 }
                    },
                    new Projection()
                    {
                        code = "EPSG:3008",
                        definition = "+proj=tmerc +lat_0=0 +lon_0=13.5 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs ",
                        extent = new double[] { 60857.4994, 6120098.8505, 223225.0217, 6906693.7888 }
                    },
                    new Projection()
                    {
                        code = "EPSG:3009",
                        definition = "+proj=tmerc +lat_0=0 +lon_0=15 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
                        extent = new double[] { 56294.0365, 6203542.5282, 218719.0581, 6835499.2391 }
                    },
                    new Projection()
                    {
                        code = "EPSG:3010",
                        definition = "+proj=tmerc +lat_0=0 +lon_0=16.5 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
                        extent = new double[] { 97213.6352, 6228930.1419, 225141.8681, 6916524.0785 }
                    },
                    new Projection()
                    {
                        code = "EPSG:3011",
                        definition = "+proj=tmerc +lat_0=0 +lon_0=18 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
                        extent = new double[] { 96664.5565, 6509617.2232, 220146.6914, 6727103.5879 }
                    },
                    new Projection()
                    {
                        code = "EPSG:3012",
                        definition = "+proj=tmerc +lat_0=0 +lon_0=14.25 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
                        extent = new double[] { 30462.5263, 6829647.9842, 216416.1584, 7154168.0208 }
                    },
                    new Projection()
                    {
                        code = "EPSG:3013",
                        definition = "+proj=tmerc +lat_0=0 +lon_0=15.75 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs ",
                        extent = new double[] { 34056.6264, 6710433.2884, 218692.0214, 7224144.7320 }
                    },
                    new Projection()
                    {
                        code = "EPSG:3014",
                        definition = "+proj=tmerc +lat_0=0 +lon_0=17.25 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
                        extent = new double[] { -1420.2800, 6888655.5779, 212669.1333, 7459585.3378 }
                    },
                    new Projection()
                    {
                        code = "EPSG:3015",
                        definition = "+proj=tmerc +lat_0=0 +lon_0=18.75 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
                        extent = new double[] { 58479.4774, 6304213.2147, 241520.5226, 7276832.4419 }
                    },
                    new Projection()
                    {
                        code = "EPSG:3016",
                        definition = "+proj=tmerc +lat_0=0 +lon_0=20.25 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
                        extent = new double[] { -93218.3385, 7034909.8738, 261434.6246, 7676279.8691 }
                    },
                    new Projection()
                    {
                        code = "EPSG:3016",
                        definition = "+proj=tmerc +lat_0=0 +lon_0=21.75 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
                        extent = new double[] { 67451.0699, 7211342.8483, 145349.5699, 7254837.2540 }
                    },
                    new Projection()
                    {
                        code = "EPSG:3018",
                        definition = "+proj=tmerc +lat_0=0 +lon_0=23.25 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
                        extent = new double[] { 38920.7048, 7267405.2323, 193050.2460, 7597992.2419 }
                    },
                    new Projection()
                    {
                        code = "EPSG:3021",
                        definition = "+proj=tmerc +lat_0=0 +lon_0=15.80827777777778 +k=1 +x_0=1500000 +y_0=0 +ellps=bessel +units=m +no_defs",
                        extent = new double[] { 1392811.0743, 6208496.7665, 1570600.8906, 7546077.6984 }
                    }
                },
                tools = new List<Tool>()
                {
                    new Tool()
                    {
                        type = "layerswitcher",
                        options = new LayerMenuOptions() {
                            baselayers = new List<string>(),
                            groups = new List<LayerGroup>(),
                            active = true,
                            visibleAtStart = true,
                            backgroundSwitcherBlack = true,
                            backgroundSwitcherWhite = true
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
            Response.Expires = 0;
            Response.ExpiresAbsolute = DateTime.Now.AddDays(-1);
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
            Response.Expires = 0;
            Response.ExpiresAbsolute = DateTime.Now.AddDays(-1);
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
