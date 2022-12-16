namespace MapService.Models
{
    public class MapExportItem
    {
        public List<MapExportItem.BaseLayerExportItem> baselayers { get; set; }

        public List<MapExportItem.GroupExportItem> groups { get; set; }

        public MapExportItem(List<MapExportItem.BaseLayerExportItem> baselayers, List<MapExportItem.GroupExportItem> groups)
        {
            this.baselayers = baselayers;
            this.groups = groups;
        }

        public class BaseLayerExportItem
        {
            public string name { get; set; }

            /// <summary>
            /// The "layers" property from the layers.json file. 
            /// </summary>
            public List<string> subLayers { get; set; }

            public BaseLayerExportItem(string name, List<string> subLayers)
            {
                this.name = name;
                this.subLayers = subLayers;
            }
        }

        public class GroupExportItem
        {
            public string name { get; set; }

            public List<GroupLayerExportItem> layers { get; set; }

            public GroupExportItem(string name, List<GroupLayerExportItem> layers)
            {
                this.name = name;
                this.layers = layers;
            }


            public class GroupLayerExportItem
            {
                /// <summary>
                /// The "caption" propery from the layers.json file. 
                /// </summary>
                public string name { get; set; }

                /// <summary>
                /// The "layers" property from the layers.json file. 
                /// </summary>
                public List<string> subLayers { get; set; }

                /// <summary>
                /// Creates a new LayerExportItem. 
                /// </summary>
                /// <param name="name">The "caption" propery from the layers.json file.</param>
                /// <param name="subLayers">The "layers" propery from the layers.json file.</param>
                public GroupLayerExportItem(LayerExportItem.LayerExportBaseItem layerExportItem)
                {
                    this.name = layerExportItem.name;
                    this.subLayers = layerExportItem.subLayers;
                }
            }
        }
    }
}
