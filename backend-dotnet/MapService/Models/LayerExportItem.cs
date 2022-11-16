namespace MapService.Models
{
    public class LayerExportItem
    {
        /// <summary>
        /// The "caption" propery from the layers.json file. 
        /// </summary>
        public string caption { get; set; }

        /// <summary>
        /// The "layers" property from the layers.json file. 
        /// </summary>
        public List<string> subLayers { get; set; }

        /// <summary>
        /// Creates a new LayerExportItem. 
        /// </summary>
        /// <param name="caption">The "caption" propery from the layers.json file.</param>
        /// <param name="subLayers">The "layers" propery from the layers.json file.</param>
        public LayerExportItem(string caption, List<string> subLayers)
        {
            this.caption = caption;
            if (subLayers != null && subLayers.Count > 1)
                this.subLayers = subLayers;
        }
    }
}
