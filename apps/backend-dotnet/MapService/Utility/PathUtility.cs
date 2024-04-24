namespace MapService.Utility
{
    /// <summary>
    /// Handles absolute and relative paths. 
    /// </summary>
    public static class PathUtility
    {
        /// <summary>
        /// Gets an absolute and relative path from a configuration. 
        /// </summary>
        /// <param name="pathInConfiguration">The path in the configuration, i.e. Media:Image:Path</param>
        /// <returns>Returns an absolute path. </returns>
        /// <exception cref="Exception"></exception>
        public static string GetPath(string pathInConfiguration)
        {
            IConfiguration configuration = ConfigurationUtility.GetConfiguration();
            return GetPath(configuration, pathInConfiguration);
        }

        /// <summary>
        /// Gets an absolute and relative path from a configuration. 
        /// </summary>
        /// <param name="configuration">The configuration, i.e. appsettings.json. </param>
        /// <param name="pathInConfiguration">The path in the configuration, i.e. Media:Image:Path</param>
        /// <returns>Returns an absolute path. </returns>
        /// <exception cref="Exception"></exception>
        public static string GetPath(IConfiguration configuration, string pathInConfiguration)
        {
            string? pathToFolder = configuration.GetSection(pathInConfiguration).Value;

            var path = string.Empty;
            Uri? pathAbsolut = GetUriPath(pathToFolder, UriKind.Absolute);
            if (pathAbsolut != null)
                path = pathAbsolut.AbsolutePath;

            Uri? pathRelative = GetUriPath(pathToFolder, UriKind.Relative);
            if (pathRelative != null)
            {
                object? configurationObject = AppDomain.CurrentDomain.GetData("ContentRootPath");
                if (configurationObject == null)
                    throw new Exception("Configuration path Error");

                if (!(configurationObject is string))
                    throw new Exception("Configuration path Error");

                var contentRootPath = configurationObject as string;
                path = Path.GetFullPath(
                    Path.Combine(Path.GetDirectoryName(contentRootPath), pathRelative.OriginalString));
            }

            return path;
        }

        private static Uri? GetUriPath(string? pathToFolder, UriKind kindOfUri)
        {
            Uri? path;
            Uri.TryCreate(pathToFolder, kindOfUri, out path);
            return path;
        }
    }
}
