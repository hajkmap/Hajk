using log4net;
using System;
using System.Linq;
using System.ServiceModel;
using System.ServiceModel.Activation;
using System.ServiceModel.Web;

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
        /// Sparar inställningar för en avnändare.
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
    }

    [ServiceBehavior(InstanceContextMode = InstanceContextMode.PerCall, ConcurrencyMode = ConcurrencyMode.Multiple)]
    [AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Allowed)]
    public sealed class SettingsService: ISettingsService, IDisposable
    {
        private readonly DataAccess.SettingsDbContext _settingsDbContext;
        private static readonly ILog Logger = LogManager.GetLogger("Inställningar");

        public SettingsService()
        {
            try
            {
                _settingsDbContext = new DataAccess.SettingsDbContext();
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
                return _settingsDbContext.GetBookmarks(username);
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
                _settingsDbContext.SaveBookmark(bookmark);
                return _settingsDbContext.GetBookmarks(username);
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
                _settingsDbContext.RemoveBookmark(uid);
                string username = this.GetUserName();
                return _settingsDbContext.GetBookmarks(username);
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
                _settingsDbContext.UpdateBookmark(bookmark);
                string username = this.GetUserName();
                return _settingsDbContext.GetBookmarks(username);
            }
            catch (Exception ex)
            {
                Logger.Warn("Inställningar kunde inte uppdateras för en klient.", ex);
                throw new WebFaultException<string>("Update failed.", System.Net.HttpStatusCode.InternalServerError);
            }
        }

        public void Dispose()
        {
            try
            {
                _settingsDbContext.Dispose();
            }
            catch (Exception ex)
            {
                Logger.Warn("Uppkoppling mot databas städades ej undan ordentligt.", ex);
            }
        }
    }
}
