using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Components.MapExport
{
    public class Feature
    {
        public string type { get; set; }
        public Metadata attributes { get; set; }
        public List<double[]> coordinates { get; set; }
    }
}
