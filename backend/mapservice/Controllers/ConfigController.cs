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
using System.Security.Principal;

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
                _log.ErrorFormat("File not found: {0}", file);
                throw new HttpException(404, "File not found");
            }
        }

        public void Create(string id)
        {
            string folder = String.Format("{0}App_Data", HostingEnvironment.ApplicationPhysicalPath);
            string file = String.Format("{0}\\{1}.json", folder, id);
            string fileName = Path.GetFileNameWithoutExtension(file);

            _log.DebugFormat("Creating file: {0}\\{1}.json", folder, id);
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
                    geoserverLegendOptions = "",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#3007",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#3008",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#3009",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#3010",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#3011",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#3012",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#3013",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#3014",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#3015",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#3016",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#3017",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#3018",
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
                        code = "http://www.opengis.net/gml/srs/epsg.xml#3021",
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
                _log.Warn("MapConfigurationFile " + mapConfigurationFile + " is missing the 'title' object");
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
                _log.Warn("MapConfigurationFile " + mapConfigurationFile + " is missing the object 'dropDownThemeMap'");
                return false;
            }

            if (dropdownThemeMaps.Value<Boolean>() == false)
            {
                _log.Info("MapConfigurationFile " + mapConfigurationFile + " has the 'dropDownThemeMap' key set to 'false' ");
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
        private bool UseAdLookup()
        {
            var identity = WindowsIdentity.GetCurrent();
            if(identity == null)
            {
                _log.Info("No username found indicating Windows authentication not used. AD lookup will not be used.");
                return false;
            }
            _log.DebugFormat("UseAdLookup: user {0}, Impersonation level: {1}", identity.Name, identity.ImpersonationLevel.ToString());
            var parameters = GetLookupParameters();
            if (identity.ImpersonationLevel != TokenImpersonationLevel.Impersonation || string.IsNullOrEmpty(parameters["ADuser"]) || string.IsNullOrEmpty(parameters["ADpassword"]))
            {
                _log.Debug("Will not use AD lookup. Check Windows authentication, ASP.NET Impersonation and AD-config values in Web.config.");
                return false;
            }
            _log.Debug("Using AD lookup");
            return true;
        }
        private ActiveDirectoryLookup GetAdLookup()
        {
            if(!UseAdLookup())
            {
                _log.Error("No AD-information found in Web.config. Not possible to query AD");
                return null;
            }

            _log.Debug("AD-information found in Web.config and will be used.");
            var parameters = GetLookupParameters();
            return new ActiveDirectoryLookup(parameters["ADdomain"], parameters["ADcontainer"], parameters["ADuser"], parameters["ADpassword"]);
        }
        private List<ThemeMap> GetAllowedMapConfigurations()
        {
            string folder = String.Format("{0}App_Data", HostingEnvironment.ApplicationPhysicalPath);
            IEnumerable<string> files = Directory.EnumerateFiles(folder, "*.json");
            List<ThemeMap> mapConfigurationsList = new List<ThemeMap>();

            var activeUser = "";
            var userGroups = new string [0];
            if (UseAdLookup()) // Should we use AD-lookup?
            {
                var adLookup = GetAdLookup();
                activeUser = adLookup.GetActiveUser();
                userGroups = adLookup.GetGroups(activeUser);
            }

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
                        var mapTitle = GetMapConfigurationTitle(mapConfiguration, mapConfigurationFile);

                        if (!UseAdLookup()) // Tillåt att man använder dropdownbox utan inloggning och validering mot AD
                        {
                            if (mapTitle == null)
                                _log.Warn("MapConfigurationFile " + mapConfigurationFile + ", map object is missing 'title'");
                            mapConfigurationsList.Add(AddNewThemeMap(fileName, mapTitle == null ? fileName + ": Add title to this map" : mapTitle.ToString()));
                        }
                        else
                        {
                            if (visibleForGroups == null)
                                _log.Info("MapConfigurationFile " + mapConfigurationFile + ", Layerswitcher tool is missing 'visibleForGroups' (or it may be empty)");
                            if (mapTitle == null)
                                _log.Info("MapConfigurationFile " + mapConfigurationFile + ", map object is missing 'title'");

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
                                                // Kontrollera att denna kartdefinition inte redan lagts till
                                                if (!mapConfigurationsList.Exists(x => x.mapConfigurationName == fileName))
                                                    mapConfigurationsList.Add(AddNewThemeMap(fileName, mapTitle.ToString()));
                                            }
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
        public string GetUserGroups()
        {
            var parameters = GetLookupParameters();

            Response.Expires = 0;
            Response.ExpiresAbsolute = DateTime.Now.AddDays(-1);
            Response.ContentType = "text/html; charset=utf-8";
            Response.Headers.Add("Cache-Control", "private, no-cache");

            return parameters["defaultADGroupsForAdmin"];
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
                { "ADdomain", appsettings["ActiveDirectoryDomain"] == null ? "" : appsettings["ActiveDirectoryDomain"] },
                { "ADuser", appsettings["ActiveDirectoryUser"] == null ? "" : appsettings["ActiveDirectoryUser"] },
                { "ADpassword", appsettings["ActiveDirectoryUserPassword"] == null ? "" : appsettings["ActiveDirectoryUserPassword"] },
                { "ADcontainer", appsettings["ActiveDirectoryContainer"] == null ? "" : appsettings["ActiveDirectoryContainer"] },
                { "defaultADGroupsForAdmin", appsettings["defaultADGroupsForAdmin"] == null ? "" : appsettings["defaultADGroupsForAdmin"] }
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
                    _log.InfoFormat("Can't filter layers because layer with id {0} is missing the key 'visibleForGroups' (or it may be empty)", layer.SelectToken("$.id"));
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
        private JToken FilterSearchLayersByAD (ActiveDirectoryLookup adLookup, JToken mapConfiguration, string activeUser)
        {
            var childrenToRemove = new List<string>();  
            var searchTool = mapConfiguration.SelectToken("$.tools[?(@.type == 'search')]");
            var layersInSearchTool = searchTool.SelectToken("$.options.layers");
            var userGroups = adLookup.GetGroups(activeUser);

            if(layersInSearchTool == null)
            {
                _log.Warn("SearchTool is missing the layersobject");
                return mapConfiguration;
            }
            else
            {
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
                        _log.Info("Can't filter search layers because the key 'visibleForGroups' is missing, incorrect or empty");
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
                //if (!layersInSearchTool.HasValues)
                //{
                //    layersInSearchTool.Replace(null);
                //}
                return mapConfiguration;
            }        
        }
        private JToken FilterEditLayersByAD(ActiveDirectoryLookup adLookup, JToken mapConfiguration, string activeUser)
        {
            var childrenToRemove = new List<string>();
            var editTool = mapConfiguration.SelectToken("$.tools[?(@.type == 'edit')]");
            var layersInEditTool = editTool.SelectToken("$.options.layers");
            var userGroups = adLookup.GetGroups(activeUser);

            if (layersInEditTool == null)
            {
                _log.Warn("EditTool is missing the layersobject");
                return mapConfiguration;
            }
            else
            {
                foreach (JToken child in layersInEditTool.Children())
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
                        _log.Info("Can't filter edit layers because the key 'visibleForGroups' is missing, incorrect or empty");
                    }

                    if (!allowed)
                    {
                        childrenToRemove.Add(child.SelectToken("$.id").ToString());
                    }
                }

                foreach (string id in childrenToRemove)
                {
                    layersInEditTool.SelectToken("$.[?(@.id=='" + id + "')]").Remove();
                }

                return mapConfiguration;
            }
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
                    _log.Info("Can't filter tools because " + tool.SelectToken("$.type") + " is missing the key 'visibleForGroups' (or it may be empty)");
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
                _log.DebugFormat("Executing GetConfig, name='{0}'", name);

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
                    return GetUserGroups();
                }

                string file = String.Format("{0}App_Data\\{1}.json", HostingEnvironment.ApplicationPhysicalPath, name);

                if (System.IO.File.Exists(file))
                {
                    if (!UseAdLookup()) // Ingen filtrering ska göras om AD-koppling inte ska användas
                        return System.IO.File.ReadAllText(file);

                    var parameters = GetLookupParameters();
                    var adLookup = GetAdLookup();
                    var activeUser = adLookup.GetActiveUser();
                    var isRequestFromAdmin = true;

                    if (Request.UrlReferrer != null && Request.UrlReferrer.ToString().IndexOf("/admin") == -1)
                    {
                        isRequestFromAdmin = false;
                    }

                    if (activeUser.Length != 0 && name != "layers" && !isRequestFromAdmin)
                    {
                        _log.DebugFormat("Filtering map configuration '{0}' for user '{1}'.", name, activeUser);

                        JToken mapConfiguration = JsonConvert.DeserializeObject<JToken>(System.IO.File.ReadAllText(file));

                        // Filter layers
                        var filteredMapConfiguration = FilterLayersByAD(adLookup, mapConfiguration, activeUser);
                        
                        // Filter tools
                        filteredMapConfiguration = FilterToolsByAD(adLookup, filteredMapConfiguration, activeUser);

                        // Filter search layers
                        var searchTool = filteredMapConfiguration.SelectToken("$.tools[?(@.type == 'search')]");
                        if (searchTool != null)
                        {
                            filteredMapConfiguration = FilterSearchLayersByAD(adLookup, filteredMapConfiguration, activeUser);
                        }

                        // Filter edit layers
                        var editTool = filteredMapConfiguration.SelectToken("$.tools[?(@.type == 'edit')]");
                        if (editTool != null)
                        {
                            filteredMapConfiguration = FilterEditLayersByAD(adLookup, filteredMapConfiguration, activeUser);
                        }

                        return filteredMapConfiguration.ToString();
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
                _log.FatalFormat("Can't get configuration file: {0}", e);
                throw e;
            }
        }
    }
}
