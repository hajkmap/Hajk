using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Components.MapExport
{
    public class Style
    {
        public string fillColor { get; set; } // "#FC345C"
        public double? fillOpacity { get; set; } // 0.5
        public string strokeColor { get; set; } // "#FC345C",
        public double? strokeOpacity { get; set; } // 1,
        public double? strokeWidth { get; set; } // 3,
        public string strokeLinecap { get; set; } // "round",
        public string strokeDashstyle { get; set; } // "solid",
        public double? pointRadius { get; set; } // 10,        
        public string pointFillColor { get; set; } // "#FC345C",
        public string pointSrc { get; set; } // ""
        public string labelAlign { get; set; } // "cm",
        public string labelOutlineColor { get; set; } // "white",
        public double? labelOutlineWidth { get; set; } // 3
        public string fontSize { get; set; } // "16"
        public string fontColor { get; set; } // #FFFFFF
    }
}
