namespace MapService.Models
{
    public class WMSLayer
    {
        /// <example>
        /// 2
        /// </example>
        public string? id { get; set; }

        /// <example>
        /// Nedtonad stadskarta Göteborg
        /// </example>
        public string? caption { get; set; }
        
        public string? internalLayerName { get; set; }

        /// <example>
        /// https://opengeodata.goteborg.se/services/stadskarta/wms/v4
        /// </example>
        public string? url { get; set; }

        public string? customGetMapUrl { get; set; }

        public string? owner { get; set; }

        public string? date { get; set; }

        public string? content { get; set; }

        public string? legend { get; set; }

        public string? legendIcon { get; set; }


        /// <example>
        /// ESPG:3006
        /// </example>
        public string? projection { get; set; }

        /// <example>
        /// [stadskarta_nedtonad]
        /// </example>
        public string[]? layers { get; set; }

        public LayerInfo[]? layersInfo { get; set; }

        public string? searchFields { get; set; }

        public string? displayFields { get; set; }

        /// <summary>
        /// Show at start
        /// </summary>
        public bool visibleAtStart { get; set; }

        public bool tiled { get; set; }

        public bool showAttributeTableButton { get; set; }

        /// <example>
        /// 1
        /// </example>
        public int opacity { get; set; }

        /// <example>
        /// -1
        /// </example>
        public int maxZoom { get; set; }

        /// <example>
        /// -1
        /// </example>
        public int minZoom { get; set; }

        public bool minMaxZoomAlertOnToggleOnly { get; set; }

        public bool singleTile { get; set; }

        public bool hidpi { get; set; }

        /// <example>
        /// 0
        /// </example>
        public int customRatio { get; set; }

        /// <example>
        /// image/png
        /// </example>
        public string? imageFormat { get; set; }

        /// <example>
        /// geoserver
        /// </example>
        public string? serverType { get; set; }

        public string? attribution { get; set; }

        public string? searchUrl { get; set; }

        public string? searchPropertyName { get; set; }

        public string? searchDisplayName { get; set; }

        public string? secondaryLabelFields { get; set; }

        public string? searchShortDisplayName { get; set; }

        public string? searchOutputFormat { get; set; }

        public string? searchGeometryField { get; set; }

        public bool infoVisible { get; set; }

        public string? infoTitle { get; set; }

        /// <example>
        /// Sammansatt bakgrundskarta i gråton.
        /// </example>
        public string? infoText { get; set; }

        public string? infoUrl { get; set; }

        public string? infoUrlText { get; set; }

        /// <example>
        /// Stadsbyggnadskontoret Göteborg
        /// </example>
        public string? infoOwner { get; set; }
        
        public bool timeSliderVisible { get; set; }

        public string? timeSliderStart { get; set; }

        public string? timeSliderEnd { get; set; }

        public string? version { get; set; }

        /// <example>
        /// application/json
        /// </example>
        public string? infoFormat { get; set; }

        public string? infoClickSortProperty { get; set; }

        public bool infoClickSortDesc { get; set; }

        public string? infoClickSortType { get; set; }

        public bool hideExpandArrow { get; set; }

        public string? zIndex { get; set; }
    }
}
