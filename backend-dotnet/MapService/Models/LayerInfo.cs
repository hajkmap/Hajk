namespace MapService.Models
{
    public class LayerInfo
    {
        /// <example>
        /// stadskarta_nedtonad
        /// </example>
        public string? id { get; set; }

        public string? caption { get; set; }
        
        public string? internalLayerName { get; set; }
        
        public string? legend { get; set; }
        
        public string? legendIcon { get; set; }
        
        public string? infobox { get; set; }
        
        public string? style { get; set; }
        
        public bool queryable { get; set; }
        
        public string? searchDisplayName { get; set; }
        
        public string? searchGeometryField { get; set; }
        
        public string? searchOutputFormat { get; set; }
        
        public string? searchPropertyName { get; set; }
        public string? searchUrl { get; set; }
    }
}
