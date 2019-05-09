using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Models.Config
{
    class LayerConfig
    {
        public List<WMTSConfig> wmtslayers { get; set; }

        public List<WMSConfig> wmslayers { get; set; }

        public List<WFSConfig> wfslayers { get; set; }

        public List<VectorConfig> vectorlayers { get; set; }

        public List<WFSTConfig> wfstlayers { get; set; }

        public List<ArcGISConfig> arcgislayers { get; set; }
    }
}
