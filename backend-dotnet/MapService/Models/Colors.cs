namespace MapService.Models
{
    public class Colors
    {
        /// <summary>
        /// Either 'default' or 'user'. If 'user', the settings 'primaryColor' and 'secondaryColor' are used.
        /// </summary>
        /// <example>
        /// user
        /// </example>
        public string? preferredColorScheme { get; set; }

        /// <summary>
        /// The primary color in hex
        /// </summary>
        /// <example>
        /// #bb6666
        /// </example>
        public string? primaryColor { get; set; }

        /// <summary>
        /// The secondary color in hex.
        /// </summary>
        /// <example>
        /// #7e6234
        /// </example>
        public string? secondaryColor { get; set; }
    }
}
