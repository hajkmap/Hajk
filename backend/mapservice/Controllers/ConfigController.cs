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
using MapService.Attributes;
using System.Web.Http.Cors;

namespace MapService.Controllers
{
    [CORSActionFilter]
    public class ConfigController : Controller
    {
        ILog _log = LogManager.GetLogger(typeof(ConfigController));

        private readonly SettingsDbContext settingsDataContext = new SettingsDbContext();

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
            if (identity == null)
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
            if (!UseAdLookup())
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
            var userGroups = new string[0];
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

        private string FilterSearchLayersByAD(ActiveDirectoryLookup adLookup, JToken mapConfiguration, string activeUser)
        {
            var childrenToRemove = new List<string>();
            var searchTool = mapConfiguration.SelectToken("$.tools[?(@.type == 'search')]");
            var layersInSearchTool = searchTool.SelectToken("$.options.layers");
            var userGroups = adLookup.GetGroups(activeUser);

            if (layersInSearchTool == null)
            {
                _log.Warn("SearchTool is missing the layersobject");
                return mapConfiguration.ToString();
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
                return mapConfiguration.ToString();
            }
        }

        private bool IsGroupAllowedAccess(string[] userGroups, JToken visibleForGroups)
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

            foreach (JToken tool in tools)
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

        private string GetUserGroups()
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
        private Dictionary<string, string> GetLookupParameters()
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

        public void Delete(string id)
        {
            var method = Request.HttpMethod;
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
            System.IO.File.Copy(folder + "\\templates\\map.template", file);
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

                if (name.ToLower() == "listimage")
                {
                    return ListImage();
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
                _log.FatalFormat("Can't get configuration file: {0}", e);
                throw e;
            }
        }

        public string ListImage()
        {
            Response.Expires = 0;
            Response.ExpiresAbsolute = DateTime.Now.AddDays(-1);
            Response.ContentType = "application/json; charset=utf-8";
            Response.Headers.Add("Cache-Control", "private, no-cache");

            string tempPath = "/Upload";
            string folder = Server.MapPath(tempPath);

            IEnumerable<string> files = Directory.GetFiles(folder);
            List<string> fileList = new List<string>();
            foreach (string file in files)
            {
                string fileName = String.Empty;
                if (Path.GetExtension(file).ToLower() == ".png" || Path.GetExtension(file).ToLower() == ".jpg" || Path.GetExtension(file).ToLower() == ".jpeg")
                {
                    fileName = Path.GetFileName(file);
                    if (fileName != "layers")
                    {
                        fileList.Add(fileName);
                    }
                }
            }
            return JsonConvert.SerializeObject(fileList);
        }
    }
}
