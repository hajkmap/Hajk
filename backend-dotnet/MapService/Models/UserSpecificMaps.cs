namespace MapService.Models
{
    public class UserSpecificMaps
    {
        public string? MapConfigurationName { get; set; }
        public string? MapConfigurationTitle { get; set; }
        internal IEnumerable<string>? VisibleForGroups { get; set; }
    }
}