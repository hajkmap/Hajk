using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Components.MapExport
{
    public class MapExportItem
    {
        public List<FeatureInfo> vectorLayers { get; set; }
        public List<WMSInfo> wmsLayers { get; set; }
        public List<WMTSInfo> wmtsLayers { get; set; }
        public List<ArcGISInfo> arcgisLayers { get; set; }
        public string orientation { get; set; }
        public string format { get; set; }
        public string scale { get; set; }
        public int resolution { get; set; }
        public int[] size { get; set; }
        public double[] bbox { get; set; }        
    }
}
