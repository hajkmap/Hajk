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

        public string internalLayerName { get; set; }

        public string url { get; set; }

        public string owner { get; set; }

        public string date { get; set; }

        public string content { get; set; }

        public string legend { get; set; }

        public string legendIcon { get; set; }

        public string projection { get; set; }

        public bool visibleAtStart { get; set; }

        public string layer { get; set; }

        public string style { get; set; }

        public string matrixSet { get; set; }     
           
        public string[] origin { get; set; }        

        public string[] resolutions { get; set; }

        public string[] matrixIds { get; set; }

        public string attribution { get; set; }
        
        public bool infoVisible { get; set; }

        public string infoTitle { get; set; }

        public string infoText { get; set; }

        public string infoUrl { get; set; }

        public string infoUrlText { get; set; }

        public string infoOwner { get; set; }

        public bool timeSliderVisible { get; set; }

        public string timeSliderStart { get; set; }

        public string timeSliderEnd { get; set; }
        
        public string infoClickSortType { get; set; }

        public bool infoClickSortDesc { get; set; }

        public string infoClickSortProperty { get; set; }        

        public int? zIndex { get; set; }

        public int minZoom { get; set; }

        public int maxZoom { get; set; }

    }
}
