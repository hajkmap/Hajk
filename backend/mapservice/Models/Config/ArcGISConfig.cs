using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Models.Config
{
    public class ArcGISConfig : ILayerConfig
    {
        public string id { get; set; }

        public string caption { get; set; }

        public string url { get; set; }

        public string owner { get; set; }

        public string date { get; set; }

        public string content { get; set; }

        public string legend { get; set; }

        public string projection { get; set; }

        public bool visibleAtStart { get; set; }

        public string[] layers{ get; set; }

        public string[] extent { get; set; }

        public double opacity { get; set; }

        public string infobox{ get; set; }

        public bool queryable { get; set; }
    }
}
