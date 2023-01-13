using MapService.Models;

namespace MapService.Filters
{
    internal static class ConfigFilter
    {
        internal static IEnumerable<UserSpecificMaps> FilterUserSpecificMaps(IEnumerable<UserSpecificMaps> userSpecificMaps, IEnumerable<string>? adUserGroups)
        {
            var filteredUserSpecificMaps = new List<UserSpecificMaps>();

            if (adUserGroups == null || !adUserGroups.Any()) { return filteredUserSpecificMaps; }

            foreach (var userSpecificMap in userSpecificMaps)
            {
                if (userSpecificMap.VisibleForGroups == null || !userSpecificMap.VisibleForGroups.Any() ||
                    adUserGroups.Any(adUserGroup => userSpecificMap.VisibleForGroups.Any(visibleForGroup => visibleForGroup == adUserGroup)))
                {
                    filteredUserSpecificMaps.Add(userSpecificMap);
                }
            }

            return filteredUserSpecificMaps;
        }
    }
}