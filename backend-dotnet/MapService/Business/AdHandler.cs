using MapService.Caches;
using MapService.Models;
using MapService.Utility;
using Microsoft.Extensions.Caching.Memory;
using System.DirectoryServices;
using System.Security.Principal;

namespace MapService.Business.Ad
{
    internal class AdHandler
    {
        private readonly AdCache _adCache;
        private readonly ILogger _logger;

        internal AdHandler(IMemoryCache memoryCache, ILogger logger)
        {
            _adCache = new AdCache(memoryCache, logger);
            _logger = logger;
        }

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

        private AdUser? FindUser(string? userprincipalname)
        {
            if (string.IsNullOrEmpty(userprincipalname)) { return null; }

            if (!_adCache.GetAdUsers().ContainsKey(userprincipalname))
            {
                var adUser = GetUserFromAd(userprincipalname);

                _adCache.SetUser(userprincipalname, adUser);

                var adGroupsForUser = GetGroupsForUserFromAd(adUser.DistinguishedName);

                _adCache.SetGroupsPerUser(userprincipalname, adGroupsForUser);
            }

            _adCache.GetAdUsers().TryGetValue(userprincipalname, out var user);

            return user;
        }

        private static AdUser GetUserFromAd(string? userPrincipalName)
        {
            var user = new AdUser();

            if (string.IsNullOrEmpty(userPrincipalName)) { return user; }

            var directorySearcher = CreateDirectorySearcher();

            directorySearcher.Filter = string.Format("(&(objectClass=user)(userPrincipalName={0}))", userPrincipalName);

            directorySearcher.PropertiesToLoad.Add("distinguishedname");
            directorySearcher.PropertiesToLoad.Add("userprincipalname");
            directorySearcher.PropertiesToLoad.Add("samaccountname");
            directorySearcher.PropertiesToLoad.Add("mail");
            directorySearcher.PropertiesToLoad.Add("whencreated");
            directorySearcher.PropertiesToLoad.Add("pwdlastset");
            directorySearcher.PropertiesToLoad.Add("useraccountcontrol");
            directorySearcher.PropertiesToLoad.Add("sn");
            directorySearcher.PropertiesToLoad.Add("givenname");
            directorySearcher.PropertiesToLoad.Add("cn");
            directorySearcher.PropertiesToLoad.Add("displayname");

            SearchResult? searchResultUser = null;

            try
            {
                searchResultUser = directorySearcher.FindOne();
            }
            catch
            {
            }

            if (searchResultUser != null)
            {
                user = new AdUser
                {
                    Dn = searchResultUser.Properties["distinguishedname"][0].ToString(),
                    DistinguishedName = searchResultUser.Properties["distinguishedname"][0].ToString(),
                    UserPrincipalName = searchResultUser.Properties["userprincipalname"][0].ToString(),
                    SAMAccountName = searchResultUser.Properties["samaccountname"][0].ToString(),
                    Mail = searchResultUser.Properties["mail"][0].ToString(),
                    WhenCreated = searchResultUser.Properties["whencreated"][0].ToString(),
                    PwdLastSet = searchResultUser.Properties["pwdlastset"][0].ToString(),
                    UserAccountControl = searchResultUser.Properties["useraccountcontrol"][0].ToString(),
                    Sn = searchResultUser.Properties["sn"][0].ToString(),
                    GivenName = searchResultUser.Properties["givenname"][0].ToString(),
                    Cn = searchResultUser.Properties["cn"][0].ToString(),
                    DisplayName = searchResultUser.Properties["displayname"][0].ToString(),
                };
            }

            return user;
        }

        private static IEnumerable<AdGroup> GetGroupsFromAd()
        {
            var groups = new List<AdGroup>();

            var directorySearcher = CreateDirectorySearcher();

            directorySearcher.Sort = new SortOption("cn", SortDirection.Ascending);

            directorySearcher.PropertiesToLoad.Add("cn");
            directorySearcher.PropertiesToLoad.Add("distinguishedname");

            directorySearcher.Filter = "(&(objectCategory=Group))";

            var results = directorySearcher.FindAll();

            if (results != null)
            {
                foreach (SearchResult searchResult in results)
                {
                    var adGroup = new AdGroup
                    {
                        Dn = searchResult.Properties["distinguishedname"][0].ToString(),
                        Cn = searchResult.Properties["cn"][0].ToString(),
                        DistinguishedName = searchResult.Properties["distinguishedname"][0].ToString(),
                    };

                    groups.Add(adGroup);
                }
            }

            return groups;
        }

        private static IEnumerable<AdGroup> GetGroupsForUserFromAd(string? distinguishedName)
        {
            var groups = new List<AdGroup>();

            if (string.IsNullOrEmpty(distinguishedName)) { return groups; }

            var directorySearcher = CreateDirectorySearcher();

            directorySearcher.Sort = new SortOption("cn", SortDirection.Ascending);

            directorySearcher.PropertiesToLoad.Add("cn");
            directorySearcher.PropertiesToLoad.Add("distinguishedname");

            directorySearcher.Filter = string.Format("(&(objectCategory=Group)(member={0}))", distinguishedName);

            var results = directorySearcher.FindAll();

            if (results != null)
            {
                foreach (SearchResult searchResult in results)
                {
                    var adGroup = new AdGroup
                    {
                        Dn = searchResult.Properties["distinguishedname"][0].ToString(),
                        Cn = searchResult.Properties["cn"][0].ToString(),
                        DistinguishedName = searchResult.Properties["distinguishedname"][0].ToString(),
                    };

                    groups.Add(adGroup);
                }
            }

            return groups;
        }

        internal bool UserIsValid(string? userPrincipalName)
        {
            var user = FindUser(userPrincipalName);

            if (user == null) { return false; }

            if (user.SAMAccountName == null) { return false; }

            return true;
        }

        public string PickUserNameToUse(string? userName)
        {
            if (userName != null)
                return userName;
            else
                return GetWindowsAuthenticationUser();
        }

        public string GetWindowsAuthenticationUser()
        {
#pragma warning disable CA1416 // Validate platform compatibility
            var activeUser = WindowsIdentity.GetCurrent();
            _logger.LogInformation("Active user {0}", activeUser.Name);

            if (activeUser.ImpersonationLevel == TokenImpersonationLevel.Impersonation)
            {
                return activeUser.Name;
            }
#pragma warning restore CA1416 // Validate platform compatibility
            else return String.Empty;
        }

        internal static bool UserHasAdAccess(string? userPrincipalName)
        {
            if (string.IsNullOrEmpty(userPrincipalName)) { return false; }

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

        internal IEnumerable<AdGroup> GetAvailableADGroups()
        {
            var adGroups = _adCache.GetAdGroups();

            if (!adGroups.Any())
            {
                adGroups = GetGroupsFromAd();

                _adCache.SetGroups(adGroups);
            }

            return adGroups;
        }

        internal Dictionary<string, AdUser> GetUsers()
        {
            return _adCache.GetAdUsers();
        }

        internal IEnumerable<AdGroup> GetGroups()
        {
            return _adCache.GetAdGroups();
        }

        internal Dictionary<string, IEnumerable<string>> GetGroupsPerUser()
        {
            return _adCache.GetAdGroupsPerUser();
        }

        internal IEnumerable<AdGroup> FindCommonGroupsForUsers(IEnumerable<string> users)
        {
            var commonGroupsForUsers = new List<AdGroup>();

            var availableADGroups = GetAvailableADGroups();

            foreach (var adGroup in availableADGroups)
            {
                bool allUserHasAdGroup = true;

                foreach (string userPrincipalName in users)
                {
                    var user = FindUser(userPrincipalName);

                    if (user == null) { allUserHasAdGroup = false; }

                    _adCache.GetAdGroupsPerUser().TryGetValue(userPrincipalName, out var adGroups);

                    if (adGroups == null || !adGroups.Contains(adGroup.Cn)) { allUserHasAdGroup = false; }
                }

                if (allUserHasAdGroup)
                {
                    commonGroupsForUsers.Add(adGroup);
                }
            }

            return commonGroupsForUsers;
        }

        internal void FlushStores()
        {
            _adCache.ClearCache();
        }
    }
}