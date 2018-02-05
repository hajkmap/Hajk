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
using log4net;
using MapService.Components;
using System.Configuration;
using Newtonsoft.Json.Linq;
using MapService.DataAccess;
using System.Collections;

namespace MapService.Controllers
{
    public class ConfigController : Controller
    {
        ILog _log = LogManager.GetLogger(typeof(ConfigController));
        private readonly SettingsDbContext settingsDataContext = new SettingsDbContext();

        public void Delete(string id)
        {
            string file = String.Format("{0}App_Data\\{1}.json", HostingEnvironment.ApplicationPhysicalPath, id);
            if (System.IO.File.Exists(file))
            {
                System.IO.File.Delete(file);
            }
            else
            {
                _log.WarnFormat("File not found: {0}", file);
                throw new HttpException(404, "File not found");
            }
        }

        public void Create(string id)
        {
            string folder = String.Format("{0}App_Data", HostingEnvironment.ApplicationPhysicalPath);
            string file = String.Format("{0}\\{1}.json", folder, id);
            string fileName = Path.GetFileNameWithoutExtension(file);

            _log.DebugFormat("{0}\\{1}.json", folder, id);
            MapConfig mapConfig = new MapConfig()
            {
                map = new MapSetting()
                {
                    title = fileName,
                    maxZoom = 3,
                    minZoom = 9,
                    zoom = 3,
                    projection = "EPSG:3006",
                    target = "map",
                    infologo = "",
                    pil = "",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#3006",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#EPSG:3007",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#EPSG:3008",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#EPSG:3009",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#EPSG:3010",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#EPSG:3011",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#EPSG:3012",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#EPSG:3013",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#EPSG:3014",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#EPSG:3015",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#EPSG:3016",
                        definition = "+proj=tmerc +lat_0=0 +lon_0=20.25 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
                        extent = new double[] { -93218.3385, 7034909.8738, 261434.6246, 7676279.8691 }
                    },
                    new Projection()
                    {
                        code = "EPSG:3017",
                        definition = "+proj=tmerc +lat_0=0 +lon_0=21.75 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
                        extent = new double[] { 67451.0699, 7211342.8483, 145349.5699, 7254837.2540 }
                    },
                    new Projection()
                    {
                        code = "http://www.opengis.net/gml/srs/epsg.xml#EPSG:3017",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#EPSG:3018",
                        definition = "+proj=tmerc +lat_0=0 +lon_0=23.25 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
                        extent = new double[] { 38920.7048, 7267405.2323, 193050.2460, 7597992.2419 }
                    },
                    new Projection()
                    {
                        code = "EPSG:3021",
                        definition = "+proj=tmerc +lat_0=0 +lon_0=15.80827777777778 +k=1 +x_0=1500000 +y_0=0 +ellps=bessel +units=m +no_defs",
                        extent = new double[] { 1392811.0743, 6208496.7665, 1570600.8906, 7546077.6984 }
                    },
                    new Projection()
                    {
                        code = "http://www.opengis.net/gml/srs/epsg.xml#EPSG:3021",
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
                            baselayers = new List<MapWMSLayerInfo>(),
                            groups = new List<LayerGroup>(),
                            active = true,
                            visibleAtStart = true,
                            backgroundSwitcherBlack = true,
                            backgroundSwitcherWhite = true,
                            instruction = String.Empty,
                            themeMapHeaderCaption = String.Empty,
                            visibleForGroups = new string[0]
                        },
                        index = 0
                    }
                },
                version = "1.0.5"
            };
            string jsonOutput = JsonConvert.SerializeObject(mapConfig, Formatting.Indented);
            System.IO.File.WriteAllText(file, jsonOutput);
        }
        private JToken GetMapConfigurationTitle(JToken mapConfiguration, string mapConfigurationFile)
        {

            var title = mapConfiguration.SelectToken("$.map.title");

            if (title == null)
            {
                _log.Error("MapConfigurationFile" + mapConfigurationFile + " is missing the 'title' object");
            }

            return title;
        } 
        private JToken GetOptionsObjectFromTool(JToken mapConfiguration, string searchKey, string tool)
        {
            var layerSwitcher = mapConfiguration.SelectToken("$.tools[?(@.type == '" + tool + "')]");
            var keyValue = layerSwitcher.SelectToken("$.options." + searchKey);

            return keyValue;
        }
        private Boolean HasActiveDropDownThemeMap(JToken mapConfiguration, string mapConfigurationFile)
        {
            var dropdownThemeMaps = GetOptionsObjectFromTool(mapConfiguration, "dropdownThemeMaps", "layerswitcher");

            if (dropdownThemeMaps == null)
            {
                _log.Error("MapConfigurationFile" + mapConfigurationFile + " is missing the object 'dropDownThemeMap'");
                return false;
            }

            if (dropdownThemeMaps.Value<Boolean>() == false)
            {
                _log.Error("MapConfigurationFile" + mapConfigurationFile + " has the 'dropDownThemeMap' key set to 'false' ");
                return false;
            }

            return true;

        }
        private ThemeMap AddNewThemeMap(string fileName, string mapTitle)
        {
            return new ThemeMap
            {
                mapConfigurationName = fileName,
                mapConfigurationTitle = mapTitle.ToString()
            };
        }
        private List<ThemeMap> GetAllowedMapConfigurations()
        {
            var parameters = GetLookupParameters();
            var adLookup = new ActiveDirectoryLookup(parameters["ADdomain"], parameters["ADcontainer"], parameters["ADuser"], parameters["ADpassword"]);
            var activeUser = adLookup.GetActiveUser();
            var userGroups = adLookup.GetGroups(activeUser);

            string folder = String.Format("{0}App_Data", HostingEnvironment.ApplicationPhysicalPath);
            IEnumerable<string> files = Directory.EnumerateFiles(folder);
            List<ThemeMap> mapConfigurationsList = new List<ThemeMap>();

            foreach (string mapConfigurationFile in files)
            {
                string fileName = Path.GetFileNameWithoutExtension(mapConfigurationFile);

                if (fileName != "layers")
                {
                    var json = System.IO.File.ReadAllText(mapConfigurationFile);
                    JToken mapConfiguration = JsonConvert.DeserializeObject<JToken>(json);


                    if (HasActiveDropDownThemeMap(mapConfiguration, mapConfigurationFile))
                    {
                        var visibleForGroups = GetOptionsObjectFromTool(mapConfiguration, "visibleForGroups", "layerswitcher");

                        if (visibleForGroups == null)
                        {
                            _log.Error("MapConfigurationFile" + mapConfigurationFile + " is missing the 'visibleForGroups' object");
                        }

                        var mapTitle = GetMapConfigurationTitle(mapConfiguration, mapConfigurationFile);

                        if (visibleForGroups != null && mapTitle != null)
                        {
                            if (visibleForGroups.First == null)
                            {
                                mapConfigurationsList.Add(AddNewThemeMap(fileName, mapTitle.ToString()));
                            }

                            if (activeUser.Length != 0 && visibleForGroups.First != null)
                            {
                                if (visibleForGroups.First.ToString() == "*")
                                {
                                    mapConfigurationsList.Add(AddNewThemeMap(fileName, mapTitle.ToString()));
                                }
                                else
                                {
                                    foreach (JToken group in visibleForGroups)
                                    {
                                        if (Array.Exists(userGroups, g => g.Equals(group.ToString())))
                                        {
                                            mapConfigurationsList.Add(AddNewThemeMap(fileName, mapTitle.ToString()));
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return mapConfigurationsList;
        }
        public string[] GetUserGroups()
        {
            var parameters = GetLookupParameters();
            var adLookup = new ActiveDirectoryLookup(parameters["ADdomain"], parameters["ADcontainer"], parameters["ADuser"], parameters["ADpassword"]);

            var activeUser = adLookup.GetActiveUser();
            var userGroups = adLookup.GetGroups(activeUser);

            Response.Expires = 0;
            Response.ExpiresAbsolute = DateTime.Now.AddDays(-1);
            Response.ContentType = "text/html; charset=utf-8";
            Response.Headers.Add("Cache-Control", "private, no-cache");

            return userGroups;
        }
        /// <summary>
        /// Set required parameters for AD lookup to dictionary.
        /// </summary>
        /// <returns>Dictionary with required values to be passed to AD lookup</returns>
        public Dictionary<string, string> GetLookupParameters()
        {
            var appsettings = ConfigurationManager.AppSettings;
            var parameters = new Dictionary<string, string>()
            {
                { "ADdomain", appsettings["ActiveDirectoryDomain"] },
                { "ADuser", appsettings["ActiveDirectoryUser"] },
                { "ADpassword", appsettings["ActiveDirectoryUserPassword"] },
                { "ADcontainer", appsettings["ActiveDirectoryContainer"] }
            };
            return parameters;
        }
        private void GetUserAllowedBaseLayers(ref JToken baseLayersInLayerSwitcher, string[] userGroups)
        {
            var layerObjectsToRemove = GetLayerObjectsToRemove(baseLayersInLayerSwitcher, userGroups);

            foreach (string id in layerObjectsToRemove)
            {
                baseLayersInLayerSwitcher.SelectToken("$.[?(@.id=='" + id + "')]").Remove();
            }
        }
        private void GetUserAllowedLayers(ref JToken groups, string[] userGroups)
        {
            foreach (JToken group in groups)
            {
                if (group.SelectToken("$.groups") != null)
                {
                    var groups2 = group.SelectToken("$.groups");
                    GetUserAllowedLayers(ref groups2, userGroups);
                }

                var layers = group.SelectToken("$.layers");
                var layerObjectsToRemove = GetLayerObjectsToRemove(layers, userGroups);

                foreach (string id in layerObjectsToRemove)
                {
                    layers.SelectToken("$.[?(@.id=='" + id + "')]").Remove();
                }
            }
        }
        private List<string> GetLayerObjectsToRemove(JToken layers, string[] userGroups)
        {
            var childrenToRemove = new List<string>();
            foreach (JToken layer in layers)
            {
                bool allowed = false;
                var visibleForGroups = layer.SelectToken("$.visibleForGroups");

                if (HasValidVisibleForGroups(visibleForGroups))
                {            
                        allowed = IsGroupAllowedAccess(userGroups, visibleForGroups);
                }
                else
                {
                    allowed = true;
                    _log.Error("Can't filter tools because layer with id " + layer.SelectToken("$.id") + " is missing the key 'VisibleForGroups'");
                }
                if (!allowed)
                {
                    childrenToRemove.Add(layer.SelectToken("$.id").ToString());
                }
            }
            return childrenToRemove;
        }
        private JToken FilterLayersByAD(ActiveDirectoryLookup adLookup, JToken mapConfiguration, string activeUser)
        {

            var layerSwitcher = mapConfiguration.SelectToken("$.tools[?(@.type == 'layerswitcher')]");
            var baseLayersInLayerSwitcher = layerSwitcher.SelectToken("$.options.baselayers");
            var groupsInLayerSwitcher = layerSwitcher.SelectToken("$.options.groups");
            var userGroups = adLookup.GetGroups(activeUser);

            GetUserAllowedLayers(ref groupsInLayerSwitcher, userGroups);
            GetUserAllowedBaseLayers(ref baseLayersInLayerSwitcher, userGroups);

            return mapConfiguration;
        }
        private string FilterSearchLayersByAD (ActiveDirectoryLookup adLookup, JToken mapConfiguration, string activeUser)
        {
            var childrenToRemove = new List<string>();  
            var searchTool = mapConfiguration.SelectToken("$.tools[?(@.type == 'search')]");
            var layersInSearchTool = searchTool.SelectToken("$.options.layers");
            var userGroups = adLookup.GetGroups(activeUser);

            if(layersInSearchTool == null)
            {
                _log.Error("SearchTool is missing the layersobject");
                throw new HttpException(500, "SearchTool is missing the layersobject"); 
            }

            foreach (JToken child in layersInSearchTool.Children())
            {
                var visibleForGroups = child.SelectToken("$.visibleForGroups");
                bool allowed = false;

                if (HasValidVisibleForGroups(visibleForGroups))
                {
                    allowed = IsGroupAllowedAccess(userGroups, visibleForGroups);
                }
                else
                {
                    allowed = true;
                    _log.Error("Can't filter search layers because search tool because the key 'VisibleForGroups' is missing or incorrect"); 
                }

                if (!allowed)
                {
                    childrenToRemove.Add(child.SelectToken("$.id").ToString());
                }
            }

            foreach (string id in childrenToRemove)
            {
                layersInSearchTool.SelectToken("$.[?(@.id=='" + id + "')]").Remove();
            }

            //NULL if User is not allowed to any searchlayer because empty array means use of global searchconfig
            if (!layersInSearchTool.HasValues)
            {
                layersInSearchTool.Replace(null);
            }
                
        return mapConfiguration.ToString();
        }
        private bool IsGroupAllowedAccess (string [] userGroups, JToken visibleForGroups)
        {
            foreach (string group in userGroups)
            {
                foreach (string ADgroup in visibleForGroups)
                {
                    if (group.Equals(ADgroup))
                    {
                        return true;
                    }
                }
            }
            return false;
        }
        private JToken FilterToolsByAD(ActiveDirectoryLookup adLookup, JToken mapConfiguration, string activeUser)
        {
            var childrenToRemove = new List<string>();
            var userGroups = adLookup.GetGroups(activeUser);
            var tools = mapConfiguration.SelectToken("$.tools");

            foreach(JToken tool in tools)
            {
                bool allowed = false;
                var visibleForGroups = tool.SelectToken("$.options.visibleForGroups");

                if (HasValidVisibleForGroups(visibleForGroups))
                {
                    allowed = IsGroupAllowedAccess(userGroups, visibleForGroups);
                }
                else
                {
                    allowed = true;
                    _log.Error("Can't filter tools because " + tool.SelectToken("$.type") + " is missing the key 'VisibleForGroups'");
                }
 
                if (!allowed)
                {
                    childrenToRemove.Add(tool.SelectToken("$.type").ToString());
                }

            }

            foreach (string type in childrenToRemove)
            {
                tools.SelectToken("$.[?(@.type=='" + type + "')]").Remove();
            }

            return mapConfiguration;
        }
        private bool HasValidVisibleForGroups(JToken visibleForGroups)
        {
            if (visibleForGroups != null)
            {
                if (visibleForGroups.HasValues && visibleForGroups.First != null)
                {
                    return true;
                }
            }
            return false;
        }
        private string UserSpecificMaps()
        {
            var allowedMapConfigurations = GetAllowedMapConfigurations();

            Response.Expires = 0;
            Response.ExpiresAbsolute = DateTime.Now.AddDays(-1);
            Response.ContentType = "application/json; charset=utf-8";
            Response.Headers.Add("Cache-Control", "private, no-cache");

            return JsonConvert.SerializeObject(allowedMapConfigurations);
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
                string fileName = String.Empty;
                if (Path.GetExtension(file) == ".json")
                {
                    fileName = Path.GetFileNameWithoutExtension(file);
                    if (fileName != "layers")
                    {
                        fileList.Add(fileName);
                    }
                }
            }
            return JsonConvert.SerializeObject(fileList);
        }
        public string GetConfig(string name)
        {
            try
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
                
                if (name.ToLower() == "userspecificmaps")
                {
                    return UserSpecificMaps();
                }

                if (name.ToLower() == "getusergroups")
                {
                    var groups = GetUserGroups();
                    
                    return string.Join(", ", groups);
                }

                string file = String.Format("{0}App_Data\\{1}.json", HostingEnvironment.ApplicationPhysicalPath, name);

                if (System.IO.File.Exists(file))
                {
                    var parameters = GetLookupParameters();
                    var adLookup = new ActiveDirectoryLookup(parameters["ADdomain"], parameters["ADcontainer"], parameters["ADuser"], parameters["ADpassword"]);
                    var activeUser = adLookup.GetActiveUser();
                    var isRequestFromAdmin = true;

                    if (Request.UrlReferrer.ToString().IndexOf("/admin") == -1)
                    {
                        isRequestFromAdmin = false;
                    }

                    if (activeUser.Length != 0 && name != "layers" && !isRequestFromAdmin)
                    {
                        JToken mapConfiguration = JsonConvert.DeserializeObject<JToken>(System.IO.File.ReadAllText(file));

                        var filteredMapConfiguration = FilterLayersByAD(adLookup, mapConfiguration, activeUser);
                        

                        filteredMapConfiguration = FilterToolsByAD(adLookup, filteredMapConfiguration, activeUser);
                        var searchTool = filteredMapConfiguration.SelectToken("$.tools[?(@.type == 'search')]");

                        if (searchTool != null)
                        {
                            return FilterSearchLayersByAD(adLookup, filteredMapConfiguration, activeUser);
                        }
                        else
                        {
                            return filteredMapConfiguration.ToString();
                        }

                    }
                    else
                    {
                        return System.IO.File.ReadAllText(file);
                    }                 
                }
                else
                {
                    throw new HttpException(404, "File not found");
                }

            }
            catch (Exception e)
            {
                _log.Fatal(e);
                throw e;
            }
        }
    }
}
