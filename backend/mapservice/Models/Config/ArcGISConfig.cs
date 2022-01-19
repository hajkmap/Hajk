using MapService.Components.MapExport;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Models.Config
{
    public class ArcGISConfig : ILayerConfig
    {
        public ArcGISInfo AsInfo(int zIndex)
        {
            ArcGISInfo info = new ArcGISInfo();
            info.extent = new MapExtent()
            {
                bottom = double.Parse(this.extent[0]),
                left = double.Parse(this.extent[1]),
                top = double.Parse(this.extent[2]),
                right = double.Parse(this.extent[3])
            };
            info.layers = this.layers.Select(l => int.Parse(l)).ToArray();
            info.url = this.url;            
            info.spatialReference = this.projection;
            info.zIndex = zIndex;
            return info;
        }

        public string id { get; set; }

        public string caption { get; set; }

        public string internalLayerName { get; set; }

        public string url { get; set; }

        public string owner { get; set; }

        public string date { get; set; }

        public string content { get; set; }

        public string legend { get; set; }

        public string projection { get; set; }

        public bool visibleAtStart { get; set; }

        public string[] layers { get; set; }

        public string[] extent { get; set; }

        public double opacity { get; set; }

        public string infobox { get; set; }

        public bool queryable { get; set; }

        public bool singleTile { get; set; }

        public string attribution { get; set; }

        public bool infoVisible { get; set; }

        public string infoTitle { get; set; }

        public string infoText { get; set; }

        public string infoUrl { get; set; }

        public string infoUrlText { get; set; }

        public string infoOwner { get; set; }

        public int? zIndex { get; set; }
    }
}
