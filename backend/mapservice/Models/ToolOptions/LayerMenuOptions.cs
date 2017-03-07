using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Models.ToolOptions
{
    public class LayerGroup
    {
        public string id { get; set; }

        public string parent { get; set; }

        public string name { get; set; }

        public bool toggled { get; set; }

        public bool expanded { get; set; }

        public List<MapWMSLayerInfo> layers { get; set; }

        public List<LayerGroup> groups { get; set; }
    }

    public class LayerMenuOptions
    {
        public List<string> baselayers { get; set; }

        public List<LayerGroup> groups { get; set; }

        public bool active { get; set; }

        public bool visibleAtStart { get; set; }

        public bool backgroundSwitcherBlack { get; set; }

        public bool backgroundSwitcherWhite { get; set; }
    }
}