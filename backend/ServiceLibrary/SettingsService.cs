using log4net;
using Sweco.Services.DataContracts;
using System;
using System.IO;
using System.Linq;
using System.ServiceModel;
using System.ServiceModel.Activation;
using System.ServiceModel.Web;
using System.Text;
using System.Web;
using System.Web.Hosting;
using Sweco.Services.DataContracts.ToolOptions;
using Sweco.Services.DataContracts.Config;

namespace Sweco.Services
{
    [ServiceContract]
    public interface ISettingsService
    {
        /// <summary>
        /// Hämtar inställningar för en avnändare.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        Bookmark[] Settings();

        /// <summary>
        /// Sparar inställningar för en användare.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        Bookmark[] SaveSetting(Bookmark bookmark);

        /// <summary>
        /// Radera bokmärke per ID.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        Bookmark[] RemoveSetting(string id);

        /// <summary>
        /// TODO: Uppdatera ett bokmärke.
        /// </summary>
        /// <returns></returns>
        [OperationContract]
        Bookmark[] UpdateSetting(Bookmark bookmark);

        /// <summary> 
        /// Hämta inställningar från JSON
        /// </summary>
        /// <returns></returns>
        [OperationContract]
        Stream Config(string name);

        /// <summary>
        /// Radera layer per ID.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        void RemoveLayer(string id);

        /// <summary>
        /// Radera WFS-layer per ID.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        void RemoveWFSLayer(string id);

        /// <summary>
        /// Uppdatera lager per ID.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        void UpdateLayer(WMSConfig layer);

        /// <summary>
        /// Uppdatera lager per ID.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        void UpdateWFSLayer(WFSConfig layer);

        /// <summary>
        /// Lägg till lager.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        void AddLayer(WMSConfig layer);

        /// <summary>
        /// Lägg till wmts-lager.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        void AddWMTSLayer(WMTSConfig layer);

        /// <summary>
        /// Lägg till arcgis-lager.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        void AddArcGISLayer(ArcGISConfig layer);

        /// <summary>
        /// Uppdatera argis-lager.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        void UpdateArcGISLayer(ArcGISConfig layer);

        /// <summary>
        /// Ta bort arcgis-lager.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        void RemoveArcGISLayer(string id);

        /// <summary>
        /// Lägg till wmts-lager.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        void UpdateWMTSLayer(WMTSConfig layer);

        /// <summary>
        /// Ta bort wmts-lager.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        void RemoveWMTSLayer(string id);

        /// <summary>
        /// Lägg till WFS-lager.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        void AddWFSLayer(WFSConfig layer);

        /// <summary>
        /// Lägg till WFST-lager.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        void AddWFSTLayer(WFSTConfig layer);

        /// <summary>
        /// Lägg till WFST-lager.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        void RemoveWFSTLayer(string id);

        /// <summary>
        /// Lägg till WFST-lager.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        void UpdateWFSTLayer(WFSTConfig layer);

        /// <summary>
        /// Lägg till vektorlager.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        void AddVectorLayer(VectorConfig layer);

        /// <summary>
        /// Lägg till vektorlager.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        void RemoveVectorLayer(string id);

        /// <summary>
        /// Lägg till vektorlager.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        void UpdateVectorLayer(VectorConfig layer);

        /// <summary>
        /// Uppdatera lagermeny.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        void UpdateLayerMenu(LayerMenuOptions config);

        /// <summary>
        /// Re index layerIDs.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [OperationContract]
        void IndexLayerMenu();
    }

    [ServiceBehavior(InstanceContextMode = InstanceContextMode.PerCall, ConcurrencyMode = ConcurrencyMode.Multiple)]
    [AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Allowed)]
    public sealed class SettingsService: ISettingsService, IDisposable
    {
        private readonly DataAccess.SettingsDbContext settingsDataContext;
        private static readonly ILog Logger = LogManager.GetLogger("Inställningar");

        public SettingsService()
        {
            try
            {
                this.settingsDataContext = new DataAccess.SettingsDbContext();
            }
            catch (Exception ex)
            {
                Logger.Fatal("Uppkoppling mot databas misslyckades.", ex);
            }
        }

        /// <summary>
        /// Hämta användares användarnamn från nuvarande kontext.
        /// Kräver windows auth.        
        /// </summary>
        /// <returns></returns>  
        private string GetUserName()
        {
            var userName = "NOT_AUTH_USER";
            var sec = ServiceSecurityContext.Current;
            if (sec != null)
            {
                if (sec.WindowsIdentity != null)
                {
                    string name = sec.WindowsIdentity.Name;
                    name = name.ToUpper();
                    string[] splitted = name.Split('\\');

                    // Hämta användarnamnet utan ev. domänprefix.
                    if (splitted.Count() == 2)
                    {
                        userName = splitted[1];
                    }
                    else if (splitted.Count() == 1)
                    {
                        userName = splitted[0];
                    }
                }
            }
            return userName.ToUpper();
        }

        /// <summary>
        /// Get bookmark by username.
        /// </summary>
        /// <param name="username"></param>
        /// <returns></returns>
        [WebGet(ResponseFormat = WebMessageFormat.Json, UriTemplate = "/")]
        public Bookmark[] Settings()
        {
            try
            {
                string username = this.GetUserName();
                return this.settingsDataContext.GetBookmarks(username);
            }
            catch (Exception ex)
            {
                Logger.Warn("Inställningar kunde inte returneras till en klient.", ex);
                throw new WebFaultException(System.Net.HttpStatusCode.InternalServerError);
            }
        }

        /// <summary>
        /// Add new bookmark.
        /// </summary>
        /// <param name="bookmark"></param>
        [WebInvoke(Method = "POST", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/")]
        public Bookmark[] SaveSetting(Bookmark bookmark)
        {
            string username = this.GetUserName();
            if (!string.IsNullOrEmpty(username))
            {
                bookmark.username = username;
            }
            else
            {
                throw new WebFaultException<string>("User is not authenticated", System.Net.HttpStatusCode.Unauthorized);
            }
            try
            {
                this.settingsDataContext.SaveBookmark(bookmark);
                return this.settingsDataContext.GetBookmarks(username);
            }
            catch (Exception ex)
            {
                Logger.Warn("Inställningar kunde inte sparas för en klient.", ex);
                throw new WebFaultException<string>("Save failed.", System.Net.HttpStatusCode.InternalServerError);
            }
        }

        /// <summary>
        /// Delete bookmark by ID.
        /// </summary>
        /// <param name="id"></param>
        [WebInvoke(Method = "DELETE", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/{id}")]
        public Bookmark[] RemoveSetting(string id)
        {
            try
            {
                int uid = int.Parse(id);
                this.settingsDataContext.RemoveBookmark(uid);
                string username = this.GetUserName();
                return this.settingsDataContext.GetBookmarks(username);
            }
            catch (Exception ex)
            {
                Logger.Warn("Inställningar kunde inte radereras för en klient.", ex);
                throw new WebFaultException<string>("Delete failed.", System.Net.HttpStatusCode.InternalServerError);
            }
        }

        /// <summary>
        /// Update bookmark
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [WebInvoke(Method = "PUT", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/")]
        public Bookmark[] UpdateSetting(Bookmark bookmark)
        {
            try
            {
                this.settingsDataContext.UpdateBookmark(bookmark);
                string username = this.GetUserName();
                return this.settingsDataContext.GetBookmarks(username);
            }
            catch (Exception ex)
            {
                Logger.Warn("Inställningar kunde inte uppdateras för en klient.", ex);
                throw new WebFaultException<string>("Update failed.", System.Net.HttpStatusCode.InternalServerError);
            }
        }

        /// <summary>
        /// Get config
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [WebGet(ResponseFormat = WebMessageFormat.Json, UriTemplate = "/config/{name}")]
        public Stream Config(string name)
        {
            string file = String.Format("{0}App_Data\\{1}.json", HostingEnvironment.ApplicationPhysicalPath, name);
            if (System.IO.File.Exists(file))
            {
                string json_data = System.IO.File.ReadAllText(file);
                WebOperationContext.Current.OutgoingResponse.ContentType = "application/json; charset=utf-8";
                WebOperationContext.Current.OutgoingResponse.LastModified = DateTime.Now;
                WebOperationContext.Current.OutgoingResponse.Headers.Add("Cache-Control", "private, no-cache");
                return new MemoryStream(Encoding.UTF8.GetBytes(json_data));  
            }
            else
            {
                throw new HttpException(404, "File not found");
            }         
        }

        /// <summary>
        /// Remove layer
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [WebInvoke(Method = "DELETE", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/layer/{id}")]
        public void RemoveLayer(string id)
        {
            this.settingsDataContext.RemoveWMSLayer(id);
        }

        /// <summary>
        /// Update layer
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [WebInvoke(Method = "PUT", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/layer")]
        public void UpdateLayer(WMSConfig layer)
        {
            this.settingsDataContext.UpdateWMSLayer(layer);
        }

        /// <summary>
        /// Add layer
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [WebInvoke(Method = "POST", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/layer")]
        public void AddLayer(WMSConfig layer)
        {
            this.settingsDataContext.AddWMSLayer(layer);
        }

        /// <summary>
        /// Add layer
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [WebInvoke(Method = "POST", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/arcgislayer")]
        public void AddArcGISLayer(ArcGISConfig layer)
        {
            this.settingsDataContext.AddArcGISLayer(layer);
        }

        /// <summary>
        /// Add layer
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [WebInvoke(Method = "POST", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/wmtslayer")]
        public void AddWMTSLayer(WMTSConfig layer)
        {
            this.settingsDataContext.AddWMTSLayer(layer);
        }


        /// <summary>
        /// Remove layer
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [WebInvoke(Method = "DELETE", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/wmtslayer/{id}")]
        public void RemoveWMTSLayer(string id)
        {
            this.settingsDataContext.RemoveWMTSLayer(id);
        }

        /// <summary>
        /// Update layer
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [WebInvoke(Method = "PUT", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/arcgislayer")]
        public void UpdateArcGISLayer(ArcGISConfig layer)
        {
            this.settingsDataContext.UpdateArcGISLayer(layer);
        }

        /// <summary>
        /// Remove ArcGIS map service layer
        /// </summary>
        /// <param name="id"></param>
        [WebInvoke(Method = "DELETE", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/arcgislayer/{id}")]
        public void RemoveArcGISLayer(string id)
        {
            this.settingsDataContext.RemoveArcGISLayer(id);
        }


        /// <summary>
        /// Update layer
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [WebInvoke(Method = "PUT", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/wmtslayer")]
        public void UpdateWMTSLayer(WMTSConfig layer)
        {
            this.settingsDataContext.UpdateWMTSLayer(layer);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="config"></param>
        [WebInvoke(Method = "PUT", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/layermenu")]
        public void UpdateLayerMenu(LayerMenuOptions config)
        {
            this.settingsDataContext.UpdateLayerMenu(config);
        }
        
        /// <summary>
        /// 
        /// </summary>
        /// <param name="id"></param>
        [WebInvoke(Method = "DELETE", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/wfslayer/{id}")]
        public void RemoveWFSLayer(string id)
        {
            this.settingsDataContext.RemoveWFSLayer(id);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="layer"></param>
        [WebInvoke(Method = "POST", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/wfslayer")]
        public void AddWFSLayer(WFSConfig layer)
        {
            this.settingsDataContext.AddWFSLayer(layer);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="layer"></param>
        [WebInvoke(Method = "PUT", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/wfslayer")]
        public void UpdateWFSLayer(WFSConfig layer)
        {
            this.settingsDataContext.UpdateWFSLayer(layer);
        }        

        /// <summary>
        /// 
        /// </summary>
        /// <param name="layer"></param>
        [WebInvoke(Method = "POST", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/wfstlayer")]
        public void AddWFSTLayer(WFSTConfig layer)
        {
            this.settingsDataContext.AddWFSTLayer(layer);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="id"></param>
        [WebInvoke(Method = "DELETE", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/wfstlayer/{id}")]
        public void RemoveWFSTLayer(string id)
        {
            this.settingsDataContext.RemoveWFSTLayer(id);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="layer"></param>
        [WebInvoke(Method = "PUT", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/wfstlayer")]
        public void UpdateWFSTLayer(WFSTConfig layer)
        {
            this.settingsDataContext.UpdateWFSTLayer(layer);
        }

        [WebInvoke(Method = "POST", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/vectorlayer")]
        public void AddVectorLayer(VectorConfig vectorConfig)
        {
            this.settingsDataContext.AddVectorLayer(vectorConfig);
        }

        [WebInvoke(Method = "DELETE", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/vectorlayer/{id}")]
        public void RemoveVectorLayer(string id)
        {
            this.settingsDataContext.RemoveVectorLayer(id);
        }

        [WebInvoke(Method = "PUT", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/vectorlayer")]
        public void UpdateVectorLayer(VectorConfig vectorConfig)
        {
            this.settingsDataContext.UpdateVectorLayer(vectorConfig);
        }

        [WebInvoke(Method = "GET", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/indexlayermenu")]
        public void IndexLayerMenu()
        {
            this.settingsDataContext.IndexLayerMenu();
        }

        /// <summary>
        /// 
        /// </summary>
        public void Dispose()
        {
            try
            {
                this.settingsDataContext.Dispose();
            }
            catch (Exception ex)
            {
                Logger.Warn("Uppkoppling mot databas städades ej undan ordentligt.", ex);
            }
        }

    }
}
