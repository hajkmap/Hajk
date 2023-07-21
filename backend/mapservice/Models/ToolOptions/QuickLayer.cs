using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Models.ToolOptions
{
    public class QuickLayer
    {
        public string id { get; set; }
        
        public bool visible { get; set; }
        
        public List<string> subLayers { get; set; }
        
        public double opacity { get; set; }
        
        public int drawOrder { get; set; }
    }
}