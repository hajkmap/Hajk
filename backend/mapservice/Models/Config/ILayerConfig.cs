using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Models.Config
{
    public interface ILayerConfig
    {
        string id { get; set; }

        string caption { get; set; }
    }
}
