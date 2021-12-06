//#define DEBUG_AD  // Uncomment to debug in Visual Studio and simulate AD values
using System;
using System.Linq;
using System.Web;
using System.DirectoryServices.AccountManagement;
using System.Configuration;
using log4net;
using System.Security.Principal;

namespace MapService.Components
{
    public class ActiveDirectoryLookup
    {
        ILog _log = LogManager.GetLogger(typeof(ActiveDirectoryLookup));

        private PrincipalContext _context = null;
        private bool _useSSL, _recursiveSearch;
        private string _domain, _container, _adUser, _adPassword;
        private string[] _groupArray = null;

        public ActiveDirectoryLookup()
        {
            GetParametersFromWebConfig();
            if (_useSSL)
                _log.Info("Reading from Active Directory using SSL.");
            else
                _log.Info("Reading from Active Directory NOT using SSL.");
        }

        private void GetParametersFromWebConfig()
        {
            var appsettings = ConfigurationManager.AppSettings;
            _domain = appsettings["ActiveDirectoryDomain"] == null ? "" : appsettings["ActiveDirectoryDomain"];
            _adUser = appsettings["ActiveDirectoryUser"] == null ? "" : appsettings["ActiveDirectoryUser"];
            _adPassword = appsettings["ActiveDirectoryUserPassword"] == null ? "" : appsettings["ActiveDirectoryUserPassword"];
            _container = appsettings["ActiveDirectoryContainer"] == null ? "" : appsettings["ActiveDirectoryContainer"];
            _useSSL = appsettings["ActiveDirectoryUseSSL"] == null ? false : appsettings["ActiveDirectoryUseSSL"] == "1";
            _recursiveSearch = appsettings["recursiveADsearch"] == null ? false : Convert.ToBoolean(appsettings["recursiveADsearch"]);
        }

        /// <summary>
        /// Searches all AD-containers specified to find the currently logged in user.
        /// </summary>
        /// <returns>UserPrincipal</returns>
        private UserPrincipal FindUserInAd()
        {
            UserPrincipal userPrincipal = null;
            try
            {
                var user = GetActiveUser();
                _log.DebugFormat("Using FindByIdentity to find user '{0}'", user);
                if (_context != null)
                {
                    return UserPrincipal.FindByIdentity(_context, user);
                }
                else
                {
                    string[] containerArray = _container.Split(';');
                    for (int i = 0; i < containerArray.Length; i++)
                    {
                        if (_useSSL)
                        {
                            _context = new PrincipalContext(ContextType.Domain, _domain, containerArray[i], ContextOptions.Negotiate | ContextOptions.SecureSocketLayer, _adUser, _adPassword);
                        }
                        else
                        {
                            _context = new PrincipalContext(ContextType.Domain, _domain, containerArray[i], _adUser, _adPassword);
                        }

                        userPrincipal = UserPrincipal.FindByIdentity(_context, user);

                        if (userPrincipal != null)
                            break;
                    }
                }
            }
            catch (Exception e)
            {
                _log.ErrorFormat("Kunde inte koppla upp mot Active Directory, kontrollera inloggningsuppgifter: error {0}", e.Message);
            }
            return userPrincipal;
        }

#if !DEBUG_AD
        /// <summary>
        /// Checks if AD lookup should be used. 
        /// AD lokkup is used if:
        /// - Windows Authentication is enabled.
        /// - Impersonation is enabled.
        /// - User to connect to AD is specified in Web.config (ActiveDirectoryUser).
        /// - Password for User to connect to AD (ActiveDirectoryUserPassword).
        /// </summary>
        /// <returns>True if AD lookup should be used, false otherwise</returns>
        public static bool UseAdLookup()
        {
            ILog _log = LogManager.GetLogger(typeof(ActiveDirectoryLookup));
            var identity = WindowsIdentity.GetCurrent();
            if (identity == null)
            {
                _log.Info("No username found indicating Windows Authentication not used. AD lookup will not be used.");
                return false;
            }
            _log.DebugFormat("UseAdLookup: user {0}, Impersonation level: {1}", identity.Name, identity.ImpersonationLevel.ToString());
            if (identity.ImpersonationLevel != TokenImpersonationLevel.Impersonation || string.IsNullOrEmpty(ConfigurationManager.AppSettings["ActiveDirectoryUser"]) || string.IsNullOrEmpty(ConfigurationManager.AppSettings["ActiveDirectoryUserPassword"]))
            {
                _log.Debug("Will not use AD lookup. Check Windows authentication, ASP.NET Impersonation and AD-config values in Web.config.");
                return false;
            }
            _log.Debug("Using AD lookup");
            return true;
        }

        /// <summary>
        /// Gets the currently logged in user if Windows Authentication and Impersonation is enabled.
        /// </summary>
        /// <returns>Name of user (with domain)</returns>
        public string GetActiveUser()
        {
            var activeUser = System.Security.Principal.WindowsIdentity.GetCurrent();
            _log.InfoFormat("Active user {0}", activeUser.Name);
            if (activeUser.ImpersonationLevel == System.Security.Principal.TokenImpersonationLevel.Impersonation)
            {
                return activeUser.Name;
            }
            else return String.Empty;            
        }

        /// <summary>
        /// This method returns the groups of which the principal is directly a member, recursive searches may be performed.
        /// Recursive search results are available for user principal objects. For more information, see the GetAuthorizationGroups method.
        /// </summary>
        public string[] GetGroups()
        {
            if (_groupArray != null)
            {
                return _groupArray;
            }
            else
            {
                PrincipalSearchResult<Principal> groups = null;
                var appsettings = ConfigurationManager.AppSettings;
                var userPrincipal = FindUserInAd();

                if (userPrincipal == null)
                {
                    _log.ErrorFormat("User '{0}' is not present in the AD-container(s) specified in Web.config", GetActiveUser());
                    throw new HttpException(404, "User not found");
                }

                try
                {
                    if (_recursiveSearch)
                    {
                        _log.Info("RecursiveSearch AD-search used");
                        groups = userPrincipal.GetAuthorizationGroups();
                    }
                    else
                    {
                        _log.Info("Non-recursive AD-search used");
                        groups = userPrincipal.GetGroups();
                    }
                }
                catch (Exception e)
                {
                    _log.ErrorFormat("Error getting groups for user '{0}', Error: {1}", GetActiveUser(), e.Message);
                }

                if (groups != null)
                {
                    _groupArray = groups.Select(g => g.Name).ToArray();
                }
                else
                {
                    _log.InfoFormat("No groups found for user '{0}', using empty group array", GetActiveUser());
                    _groupArray = new string[0];
                }

                if (_log.IsInfoEnabled)
                {
                    _log.Info("The active user is a member of the following groups:");
                    for (int i = 0; i < _groupArray.Length; i++)
                    {
                        _log.Info(_groupArray[i]);
                    }
                }

                return _groupArray;
            }
        }
#else // Methods used to debug AD in Visual Studio

        public static bool UseAdLookup()
        {
            return true;
        }

        public string GetActiveUser()
        {
            return "ADM\\User_name";
        }

        public string[] GetGroups()
        {
            return new string[2] { "Office-SEKSD01", "Group1" };
        }
#endif
    }
}
