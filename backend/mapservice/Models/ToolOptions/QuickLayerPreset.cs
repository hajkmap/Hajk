using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Models.ToolOptions
{
    public class QuickLayerPreset
    {
        public string id { get; set; }

        public string title { get; set; }
        
        public string author { get; set; }
        
        public string description { get; set; }
        
        public List<string> keywords { get; set; }
        
        public List<QuickLayer> layers { get; set; }
        
        public QuickLayerMetadata metadata { get; set; }
    }
}