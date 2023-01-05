using MapService.Utility;
using System.DirectoryServices;

namespace MapService.Business.Ad
{
    internal static class AdHandler
    {
        internal static bool AdIsActive
        {
            get { return bool.Parse(ConfigurationUtility.GetSectionItem("ActiveDirectory:Active")); }
        }

        private static string Username
        {
            get { return ConfigurationUtility.GetSectionItem("ActiveDirectory:Username"); }
        }

        private static string Password
        {
            get { return ConfigurationUtility.GetSectionItem("ActiveDirectory:Password"); }
        }

        private static string Url
        {
            get { return ConfigurationUtility.GetSectionItem("ActiveDirectory:Url"); }
        }

        private static string BaseDN
        {
            get { return ConfigurationUtility.GetSectionItem("ActiveDirectory:BaseDN"); }
        }

        private static IEnumerable<string> Groups
        {
            get { return ConfigurationUtility.GetSectionArray("ActiveDirectory:Groups"); }
        }

        private static DirectorySearcher CreateDirectorySearcher()
        {
            var path = Url + @"/" + BaseDN;

            var directoryEntry = new DirectoryEntry(path, Username, Password);
            var directorySearcher = new DirectorySearcher(directoryEntry);

            return directorySearcher;
        }

        internal static bool UserHasAdAccess(string userPrincipalName)
        {
            var directorySearcher = CreateDirectorySearcher();

            directorySearcher.PropertiesToLoad.Add("distinguishedname");

            foreach (var group in Groups)
            {
                directorySearcher.Filter = string.Format("(&(objectCategory=Group)(name={0}))", group);

                var searchResultGroup = directorySearcher.FindOne();

                if (searchResultGroup != null)
                {
                    var distinguishedGroupName = searchResultGroup.Properties["distinguishedname"][0].ToString();

                    directorySearcher.Filter = string.Format("(&(objectClass=user)(userPrincipalName={0})(memberOf={1}))", userPrincipalName, distinguishedGroupName);
                    directorySearcher.PropertiesToLoad.Add("userprincipalname");

                    var searchResultUserInGroup = directorySearcher.FindOne();

                    if (searchResultUserInGroup != null)
                    {
                        if (searchResultUserInGroup.Properties["userprincipalname"][0].ToString() == userPrincipalName)
                        {
                            return true;
                        }
                    }
                }
            }

            return false;
        }

        internal static IEnumerable<string> GetAvailableADGroups()
        {
            var directorySearcher = CreateDirectorySearcher();

            directorySearcher.Sort = new SortOption("name", SortDirection.Ascending);
            directorySearcher.PropertiesToLoad.Add("name");

            directorySearcher.Filter = "(&(objectCategory=Group))";

            var results = directorySearcher.FindAll();

            var groups = new List<string>();

            if (results != null)
            {
                foreach (SearchResult searchResult in results)
                {
                    groups.Add(searchResult.Properties["name"][0].ToString());
                }
            }

            return groups;
        }
    }
}