namespace MapService.Models
{
    public class WFSLayer
    {
        /// <example>
        /// 4
        /// </example>
        public string? id { get; set; }

        /// <example>
        /// Adresser Göteborg
        /// </example>
        public string? caption { get; set; }

        /// <example>
        /// Adresser Göteborg
        /// </example>
        public string? internalLayerName { get; set; }

        /// <example>
        /// https://opengeodata.goteborg.se/services/adresser/wfs/v1
        /// </example>
        public string? url { get; set; }

        /// <example>
        /// [adresser.wfs.v1:adresser]
        /// </example>
        public string[]? layers { get; set; }

        /// <example>
        /// [adress]
        /// </example>
        public string[]? searchFields { get; set; }

        /// <example>
        /// adress
        /// </example>
        public string? infobox { get; set; }

        public string? aliasDict { get; set; }

        /// <example>
        /// [adress]
        /// </example>
        public string[]? displayFields { get; set; }

        public string[]? shortDisplayFields { get; set; }

        /// <example>
        /// geom
        /// </example>
        public string? geometryField { get; set; }

        /// <example>
        /// GML2
        /// </example>
        public string? outputFormat { get; set; }

        /// <example>
        /// geoserver
        /// </example>
        public string? serverType { get; set; }
    }
}
