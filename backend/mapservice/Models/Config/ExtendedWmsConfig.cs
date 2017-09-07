using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MapService.Models.Config
{
    public class ExtendedWmsConfig : ILayerConfig
    {
        public string id { get; set; }

        public string caption { get; set; }

        public string url { get; set; }

        public string owner { get; set; }

        public string date { get; set; }

        public string content { get; set; }

        public string projection { get; set; }

        public string infoFormat { get; set; }
   
        public string infobox { get; set; }

        public string legend { get; set; }

        public WMSLayerLayer[] layers { get; set; }

        public string[] searchFields { get; set; }

        public string[] displayFields { get; set; }

        public bool visibleAtStart { get; set; }

        public bool tiled { get; set; }

        public bool singleTile { get; set; }

        public string imageFormat { get; set; }

        public string serverType { get; set; }

        public string attribution { get; set; }
    }
}