using MapService.Models;
using Microsoft.Extensions.Caching.Memory;

namespace MapService.Caches
{
    internal class AdCache
    {
        private readonly IMemoryCache _memoryCache;
        private readonly ILogger _logger;

        private readonly MemoryCacheEntryOptions _cacheEntryOptions = new();

        private static readonly string _cacheKeyAdUser = "AD_USERS";
        private static readonly string _cacheKeyAdGroup = "AD_GROUPS";
        private static readonly string _cacheKeyAdGroupsPerUser = "AD_GROUPS_PER_USER";
        private static readonly string _cacheLockKey = "CACHE_LOCK";

        internal AdCache(IMemoryCache memoryCache, ILogger logger)
        {
            _memoryCache = memoryCache;
            _logger = logger;
        }

        internal Dictionary<string, AdUser> GetAdUsers()
        {
            WaitForCacheLock();

            var adUsers = (Dictionary<string, AdUser>)_memoryCache.Get(_cacheKeyAdUser);

            adUsers ??= new Dictionary<string, AdUser>();

            return adUsers;
        }

        internal IEnumerable<AdGroup> GetAdGroups()
        {
            WaitForCacheLock();

            var adGroups = (IEnumerable<AdGroup>)_memoryCache.Get(_cacheKeyAdGroup);

            adGroups ??= new List<AdGroup>();

            return adGroups;
        }

        internal Dictionary<string, IEnumerable<string>> GetAdGroupsPerUser()
        {
            WaitForCacheLock();

            var adGroupsPerUser = (Dictionary<string, IEnumerable<string>>)_memoryCache.Get(_cacheKeyAdGroupsPerUser);

            adGroupsPerUser ??= new Dictionary<string, IEnumerable<string>>();

            return adGroupsPerUser;
        }

        internal void SetUser(string userprincipalname, AdUser user)
        {
            try
            {
                WaitForCacheLock();
                LockCache();

                UpdateUserCache(userprincipalname, user);
            }
            finally
            {
                UnlockCache();
            }
        }

        internal void SetGroups(IEnumerable<AdGroup> groups)
        {
            try
            {
                WaitForCacheLock();
                LockCache();

                UpdateGroupCache(groups);
            }
            finally
            {
                UnlockCache();
            }
        }

        internal void SetGroupsPerUser(string userprincipalname, IEnumerable<AdGroup> groups)
        {
            try
            {
                WaitForCacheLock();
                LockCache();

                UpdateGroupsPerUserCache(userprincipalname, groups);
            }
            finally
            {
                UnlockCache();
            }
        }

        internal void ClearCache()
        {
            try
            {
                WaitForCacheLock();
                LockCache();

                _memoryCache.Remove(_cacheKeyAdUser);
                _memoryCache.Remove(_cacheKeyAdGroup);
                _memoryCache.Remove(_cacheKeyAdGroupsPerUser);
            }
            finally
            {
                UnlockCache();
            }
        }

        private void UpdateUserCache(string userprincipalname, AdUser user)
        {
            var adUsers = (Dictionary<string, AdUser>)_memoryCache.Get(_cacheKeyAdUser);

            adUsers ??= new Dictionary<string, AdUser>();

            adUsers.Add(userprincipalname, user);

            _memoryCache.Set(_cacheKeyAdUser, adUsers, _cacheEntryOptions);
        }

        private void UpdateGroupCache(IEnumerable<AdGroup> groups)
        {
            _memoryCache.Set(_cacheKeyAdGroup, groups, _cacheEntryOptions);
        }

        private void UpdateGroupsPerUserCache(string userprincipalname, IEnumerable<AdGroup> groups)
        {
            var groupsPerUsers = (Dictionary<string, IEnumerable<string?>>)_memoryCache.Get(_cacheKeyAdGroupsPerUser);

            groupsPerUsers ??= new Dictionary<string, IEnumerable<string?>>();

            groupsPerUsers.Add(userprincipalname, groups.Select(x => x.Cn));

            _memoryCache.Set(_cacheKeyAdGroupsPerUser, groupsPerUsers, _cacheEntryOptions);
        }

        /// <summary>
        /// Waits until cache loading is done before returning.
        /// </summary>
        private void WaitForCacheLock()
        {
            while (_memoryCache.TryGetValue(_cacheLockKey, out bool _))
            {
                var seconds = 1;
                Thread.Sleep(1000 * seconds);
            }
        }

        /// <summary>
        /// Lock the cache when loading to avoid double loading of the cache.
        /// </summary>
        private void LockCache()
        {
            _memoryCache.Set(_cacheLockKey, true, _cacheEntryOptions);
        }

        /// <summary>
        /// Unlock the cache after loading to make it possible to use it after loading.
        /// </summary>
        private void UnlockCache()
        {
            _memoryCache.Remove(_cacheLockKey);
        }
    }
}