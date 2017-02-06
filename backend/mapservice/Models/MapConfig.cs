using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Models
{
    public class MapConfig
    {
        public string version { get; set; }

        public List<Projection> projections { get; set; }

        public List<Tool> tools { get; set; }

        public MapSetting map { get; set; }
    }
}