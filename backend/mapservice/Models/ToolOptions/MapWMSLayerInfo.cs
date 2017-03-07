using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Models.ToolOptions
{
    public class MapWMSLayerInfo
    {
        public string id { get; set;  }

        public bool visibleAtStart { get; set; }

        public int drawOrder { get; set; }
    }
}