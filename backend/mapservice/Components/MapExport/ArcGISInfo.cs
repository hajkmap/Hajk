using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Components.MapExport
{
    public struct MapExtent
    {
        public double top { get; set; }

        public double left { get; set; }

        public double bottom { get; set; }

        public double right { get; set; }
    }

    public class ArcGISInfo
    {
        public string url { get; set; }

        public MapExtent extent { get; set; }

        public int[] layers { get; set; }

        public string spatialReference { get; set; }
    }
}
