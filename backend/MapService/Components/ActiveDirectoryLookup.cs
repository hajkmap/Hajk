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

        public ActiveDirectoryLookup(string domain, string container, string user, string password)
        {
            try { 
            _domain = new PrincipalContext(ContextType.Domain, domain,container, user, password);
            }
            catch
            {
                _log.ErrorFormat("Kunde inte koppla upp mot Active Directory, kontrollera inloggningsuppgifter");
            }
          }

        public string GetActiveUser()
        {
            var activeUser = System.Security.Principal.WindowsIdentity.GetCurrent();
            return activeUser.Name;
        }

        //This method returns only the groups of which the principal is directly a member; no recursive searches are performed.
        //Recursive search results are available for user principal objects. For more information, see the GetAuthorizationGroups method.
        public string [] GetGroups(string user)
        {
            PrincipalSearchResult<Principal> groups;
            var appsettings = ConfigurationManager.AppSettings;
            var recursiveSearch = Convert.ToBoolean(appsettings["recursiveADsearch"]);
            var userPrincipal = UserPrincipal.FindByIdentity(_domain, user);

            if(userPrincipal == null)
            {
                _log.ErrorFormat("User is not present in the AD-container specified in Web.config");
                throw new HttpException(404, "User not found");
            }

            if (recursiveSearch)
            {
                groups = userPrincipal.GetAuthorizationGroups();
                _log.InfoFormat("RecursiveSearch AD-search used");
            }
            else
            {
                groups = userPrincipal.GetGroups();
                _log.InfoFormat("Non-recursive AD-search used");
            }

            return groups.Select(g => g.Name).ToArray();
        }
    }
}