using MapService.Components.MapExport;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Models.Config
{
    public class SubLayerConfig
    {
        public string id { get; set; }
        public string caption { get; set; }
        public string legend { get; set; }
        public string legendIcon { get; set; }
        public string infobox { get; set; }
        public string style { get; set; }
        public bool queryable { get; set; }
        public string searchDisplayName { get; set; }
        public string searchGeometryField { get; set; }
        public string searchOutputFormat { get; set; }
        public string searchPropertyName { get; set; }
        public string searchUrl { get; set; }
    }

    public class WMSConfig : ILayerConfig
    {
        public WMSInfo AsInfo(int zIndex)
        {
            WMSInfo info = new WMSInfo();
            info.coordinateSystemId = int.Parse(this.projection.Split(':')[1]);
            info.url = this.url;
            info.layers = this.layers.ToList();
            info.zIndex = zIndex;
            return info;
        }

        public string id { get; set; }

        public string caption { get; set; }

        public string url { get; set; }

        public string customGetMapUrl { get; set; }

        public string owner { get; set; }

        public string date { get; set; }

        public string content { get; set; }

        public string legend { get; set; }

        public string legendIcon { get; set; }


        public string projection { get; set; }

        public string[] layers { get; set; }

        public SubLayerConfig[] layersInfo { get; set; }

        public string[] searchFields { get; set; }

        public string[] displayFields { get; set; }

        public bool visibleAtStart { get; set; }

        public bool hideExpandArrow { get; set; }

        public bool tiled { get; set; }

        public double opacity { get; set; }

        public int minZoom { get; set; }

        public int maxZoom { get; set; }

        public bool minMaxZoomAlertOnToggleOnly { get; set; }

        public bool singleTile { get; set; }

        public string imageFormat { get; set; }

        public string serverType { get; set; }

        public string attribution { get; set; }

        public string searchUrl { get; set; }

        public double customRatio { get; set; }

        public bool hidpi { get; set; } = true;

        public string searchPropertyName { get; set; }

        public string searchDisplayName { get; set; }

        public string searchOutputFormat { get; set; }

        public string searchGeometryField { get; set; }

        public bool infoVisible { get; set; }

        public string infoTitle { get; set; }

        public string infoText { get; set; }

        public string infoUrl { get; set; }

        public string infoUrlText { get; set; }

        public string infoOwner { get; set; }

        public string infoClickSortType { get; set; }

        public bool infoClickSortDesc { get; set; }

        public string infoClickSortProperty { get; set; }        

        public string version { get; set; }

        public string infoFormat { get; set; }

        public bool timeSliderVisible { get; set; }

        public string timeSliderStart { get; set; }

        public string timeSliderEnd { get; set; }

        public int? zIndex { get; set; }
    }
}
