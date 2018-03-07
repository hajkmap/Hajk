using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Models.Config
{
    public class VectorConfig : ILayerConfig
    {
        public string id { get; set; }

        public string dataFormat { get; set; }

        public string caption { get; set; }

        public string url { get; set; }

        public string layer { get; set; }

        public string owner { get; set; }

        public string date { get; set; }

        public string content { get; set; }

        public string legend { get; set; }

        public double symbolXOffset { get; set; }

        public double symbolYOffset { get; set; }

        public string projection { get; set; }

        public string lineStyle { get; set; }

        public string lineWidth { get; set; }

        public string lineColor { get; set; }

        public string fillColor { get; set; }

        public bool visibleAtStart { get; set; }

        public double opacity { get; set; }

        public string infobox { get; set; }

        public bool queryable { get; set; }
            
        public string labelAlign { get; set; }

        public string labelBaseline { get; set; }

        public string labelSize{ get; set; }

        public int labelOffsetX { get; set; }

        public int labelOffsetY { get; set; }

        public string labelWeight { get; set; }

        public string labelFont { get; set; }

        public string labelFillColor { get; set; }

        public string labelOutlineColor { get; set; }

        public int labelOutlineWidth { get; set; }

        public string labelAttribute { get; set; }

        public bool showLabels { get; set; } 
        
        public bool infoVisible { get; set; }

        public string infoTitle { get; set; }

        public string infoText { get; set; }

        public string infoUrl { get; set; }

        public string infoUrlText { get; set; }

        public string infoOwner { get; set; }               
    }
}
