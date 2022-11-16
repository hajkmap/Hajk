namespace MapService.Models
{
    public class MapExportItem
    {
        public class BaseLayerExportItem
        {
            public Tuple<string, string> baseLayer { get; set; }

            public BaseLayerExportItem(Tuple<string, string> baseLayer)
            { 
                this.baseLayer = baseLayer;
            }
        }
    }
}
