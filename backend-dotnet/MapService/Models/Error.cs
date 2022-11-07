namespace MapService.Models
{
    public class Error
    {
        /// <example>
        /// -2
        /// </example>
        public int errno { get; set; }

        /// <example>
        /// ENOENT
        /// </example>
        public string? code { get; set; }
    }
}
