namespace MapService.Utility
{
    /// <summary>
    /// Handles configuration settings.
    /// </summary>
    public static class ConfigurationUtility
    {
        public enum Environment
        { Development, Production }

        /// <summary>
        /// Gets the configuration, i.e. the configuration fromm the appsettings.json file.
        /// </summary>
        /// <returns>Returns the configuration. </returns>
        /// <exception cref="NullReferenceException">Configuration Error</exception>
        /// <exception cref="Exception">Configuration Error</exception>
        public static IConfiguration GetConfiguration()
        {
            object? configurationObject = AppDomain.CurrentDomain.GetData("Configuration");
            if (configurationObject == null)
                throw new NullReferenceException("Configuration Error");

            if (!(configurationObject is IConfiguration))
                throw new Exception("Configuration Error");

            return configurationObject as IConfiguration;
        }

        private static Environment GetEnvironment()
        {
            var env = Environment.Production;

            if (GetSectionItem("Environment").ToLower() == "development")
            {
                env = Environment.Development;
            }

            return env;
        }

        /// <summary>
        /// Checks if the the environment in the configuration is set to development or not.
        /// </summary>
        /// <returns></returns>
        public static bool EnvironmentIsDevelopment()
        {
            if (GetEnvironment() == Environment.Development)
            {
                return true;
            }

            return false;
        }

        /// <summary>
        /// Gets the settings item for a section.
        /// </summary>
        /// <param name="sectionKeyPath">The path in the configuration, i.e. Media:Image:AllowedExtensions</param>
        /// <returns></returns>
        public static string GetSectionItem(string sectionKeyPath)
        {
            IConfiguration configuration = GetConfiguration();
            return GetSectionItem(configuration, sectionKeyPath);
        }

        /// <summary>
        /// Gets the settings item for a section.
        /// </summary>
        /// <param name="sectionKeyPath">The path in the configuration, i.e. Media:Image:AllowedExtensions</param>
        /// <returns></returns>
        public static string GetSectionItem(IConfiguration configuration, string sectionKeyPath)
        {
            return configuration.GetSection(sectionKeyPath).Get<string>();
        }

        /// <summary>
        /// Gets the settings array for a section.
        /// </summary>
        /// <param name="sectionKeyPath">The path in the configuration, i.e. Media:Image:AllowedExtensions</param>
        /// <returns></returns>
        public static IEnumerable<string> GetSectionArray(string sectionKeyPath)
        {
            IConfiguration configuration = GetConfiguration();
            return configuration.GetSection(sectionKeyPath).Get<List<string>>();
        }

        /// <summary>
        /// Gets the settings array for a section.
        /// </summary>
        /// <param name="sectionKeyPath">The path in the configuration, i.e. Media:Image:AllowedExtensions</param>
        /// <returns></returns>
        public static IEnumerable<string> GetSectionArray(IConfiguration configuration, string sectionKeyPath)
        {
            return configuration.GetSection(sectionKeyPath).Get<List<string>>();
        }

        /// <summary>
        /// Adds the letter 's' to the end of the layer type name if necessary
        /// </summary>
        /// <param name="layerTypeName">The layer type name. </param>
        /// <returns>Returns a layer type name in the plural. </returns>
        public static string SetLayerTypeName(string layerTypeName)
        {
            //If layer is e.g. wmslayer then we add 's' to the end
            if (layerTypeName.Last() != 's')
                layerTypeName = layerTypeName + "s";

            return layerTypeName;
        }
    }
}