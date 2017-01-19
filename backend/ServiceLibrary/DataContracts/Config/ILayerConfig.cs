using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sweco.Services.DataContracts.Config
{
    interface ILayerConfig
    {
        string id { get; set; }

        string caption { get; set; }
    }
}
