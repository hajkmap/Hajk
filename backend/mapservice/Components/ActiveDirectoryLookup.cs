using System;
using System.Linq;
using System.Web;
using System.DirectoryServices.AccountManagement;
using System.Configuration;
using log4net;
using MapService.Models.Config;

namespace MapService.Components
{
    public class ActiveDirectoryLookup : IUserLookup
    {
        ILog _log = LogManager.GetLogger(typeof(ActiveDirectoryLookup));

        private PrincipalContext _domain;

        public ActiveDirectoryLookup(string domain, string container, bool useSSL, string user, string password)
        {
            try {
                if (useSSL)
                {
                    _log.Info("Reading from Active Directory using SSL.");
                    _domain = new PrincipalContext(ContextType.Domain, domain, container, ContextOptions.Negotiate | ContextOptions.SecureSocketLayer, user, password);
                }
                else
                {
                    _log.Info("Reading from Active Directory NOT using SSL.");
                    _domain = new PrincipalContext(ContextType.Domain, domain, container, user, password);
                }
            }
            catch (Exception e)
            {
                _log.ErrorFormat("Kunde inte koppla upp mot Active Directory, kontrollera inloggningsuppgifter: error {0}", e.Message);
            }
          }

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

        //This method returns only the groups of which the principal is directly a member; no recursive searches are performed.
        //Recursive search results are available for user principal objects. For more information, see the GetAuthorizationGroups method.
        public string [] GetGroups(string user)
        {
            PrincipalSearchResult<Principal> groups;
            var appsettings = ConfigurationManager.AppSettings;
            var recursiveSearch = Convert.ToBoolean(appsettings["recursiveADsearch"]);
            var userPrincipal = UserPrincipal.FindByIdentity(_domain, user);

            if (userPrincipal == null)
            {
                _log.ErrorFormat("User '{0}' is not present in the AD-container specified in Web.config", user);
                throw new HttpException(404, "User not found");
            }

            if (recursiveSearch)
            {
                groups = userPrincipal.GetAuthorizationGroups();
                _log.Info("RecursiveSearch AD-search used");
            }
            else
            {
                groups = userPrincipal.GetGroups();
                _log.Info("Non-recursive AD-search used");
            }

            _log.Info("The active user is a member of the following groups:");
            foreach (string group in groups.Select(g => g.Name).ToArray())
            {
                _log.Info(group);
            }            

            return groups.Select(g => g.Name).ToArray();
        }
    }
}