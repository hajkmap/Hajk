using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.DirectoryServices.AccountManagement;

namespace MapService.Models.Config
{
    public class ActiveDirectoryLookup : IUserLookup
    {
        private PrincipalContext _domain;

        public ActiveDirectoryLookup(string domain, string user, string password)
        {
            _domain = new PrincipalContext(ContextType.Domain, domain, user, password);
        }

        public string GetActiveUser()
        {
            var user = System.Security.Principal.WindowsIdentity.GetCurrent();
            return user.Name;
        }

        //This method returns only the groups of which the principal is directly a member; no recursive searches are performed.
        //Recursive search results are available for user principal objects. For more information, see the GetAuthorizationGroups method.
        public string [] GetGroups(string user)
        {
            var foundUser = UserPrincipal.FindByIdentity(_domain, user);
            var groups = foundUser.GetGroups();

            return groups.Select(g => g.Name).ToArray();
        }


    }
}