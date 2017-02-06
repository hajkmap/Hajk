using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Models.Config
{
    public class WMTSConfig : ILayerConfig
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

        public string layer { get; set; }

        public string style { get; set; }

        public string matrixSet { get; set; }     
           
        public string[] origin { get; set; }        

        public string[] resolutions { get; set; }

        public string[] matrixIds { get; set; }

    }
}
