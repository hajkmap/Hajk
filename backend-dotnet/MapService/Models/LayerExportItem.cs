namespace MapService.Models
{
    public class LayerExportItem
    {
        public Dictionary<string, LayerExportBaseItem> layers { get; set; }

        public LayerExportItem()
        {
            this.layers = new Dictionary<string, LayerExportBaseItem>();
        }

        public class LayerExportBaseItem
        {
            /// <summary>
            /// The "caption" propery from the layers.json file. 
            /// </summary>
            public string caption { get; set; }

            /// <summary>
            /// The "layers" property from the layers.json file. 
            /// </summary>
            public List<string> subLayers { get; set; }

            public LayerExportBaseItem(string caption, List<string> subLayers)
            {
                this.caption = caption;
                if (subLayers != null && subLayers.Count > 1)
                    this.subLayers = subLayers;
            }
        }
    }
}
