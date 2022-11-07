namespace MapService.Models
{
    public class WMTSLayer
    {
        public string? attribution { get; set; }

        /// <example>
        /// test2
        /// </example>
        public string? caption { get; set; }

        public string? content { get; set; }

        public string? date { get; set; }

        public string? id { get; set; }

        public string? infoOwner { get; set; }

        public string? infoText { get; set; }

        public string? infoTitle { get; set; }

        public string? infoUrl { get; set; }

        public string? infoUrlText { get; set; }

        public bool infoVisible { get; set; }

        /// <example>
        /// topowebb
        /// </example>
        public string? layer { get; set; }

        public string? legend { get; set; }

        public string? legendIcon { get; set; }

        /// <example>
        /// [0]
        /// </example>
        public string[]? matrixIds { get; set; }

        /// <example>
        /// 3006
        /// </example>
        public string? matrixSet { get; set; }

        /// <example>
        /// -1
        /// </example>
        public int maxZoom { get; set; }

        /// <example>
        /// -1
        /// </example>
        public int minZoom { get; set; }

        /// <example>
        /// [-1200000]
        /// </example>
        public string[]? origin { get; set; }

        /// <example>
        /// EPSG:3006
        /// </example>
        public string? projection { get; set; }

        /// <example>
        /// [4096]
        /// </example>
        public string[]? resolutions { get; set; }

        /// <example>
        /// default
        /// </example>
        public string? style { get; set; }

        public string? timeSliderEnd { get; set; }

        public string? timeSliderStart { get; set; }

        public bool timeSliderVisible { get; set; }

        /// <example>
        /// https://geoservertest.halmstad.se/geoserver/wms
        /// </example>
        public string? url { get; set; }
    }
}
