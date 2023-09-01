using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Models.ToolOptions
{
    public class QuickLayerMetadata
    {
        public string savedAt { get; set; }

        public int numberOfLayers { get; set; }

        public string title { get; set; }

        public string description { get; set; }
    }
}