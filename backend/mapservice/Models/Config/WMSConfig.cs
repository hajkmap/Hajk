using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Models.Config
{
    public class WMSConfig : ILayerConfig
    {
        public string id { get; set; }

        public string caption { get; set; }

        public string url { get; set; }

        public string owner { get; set; }

        public string date { get; set; }

        public string content { get; set; }

        public string legend { get; set; }

        public string projection { get; set; }

        public string[] layers { get; set; }

        public string infobox { get; set; }

        public string[] searchFields { get; set; }   
             
        public string[] displayFields { get; set; }

        public bool visibleAtStart { get; set; }

        public bool queryable { get; set; }

        public bool tiled { get; set; }

        public bool singleTile { get; set; }

        public string imageFormat { get; set; }

        public string serverType { get; set; }
    }
}
