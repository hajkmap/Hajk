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

        string internalLayerName { get; set; }

        bool infoVisible { get; set; }

        string infoTitle { get; set; }

        string infoText { get; set; }

        string infoUrl { get; set; }

        string infoUrlText { get; set; }

        string infoOwner { get; set; }

        int? zIndex { get; set; }
    }
}
