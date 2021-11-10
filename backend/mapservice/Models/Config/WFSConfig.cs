using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Models.Config
{
    public class WFSConfig : ILayerConfig
    {
        public string id { get; set; }

        public string caption { get; set; }

        public string internalLayerName { get; set; }

        public string url { get; set; }        

        public string[] layers { get; set; }        

        public string[] searchFields { get; set; }

        public string infobox { get; set; }

        public string aliasDict { get; set; }

        public string[] displayFields { get; set; }

        public string geometryField { get; set; }

        public string outputFormat { get; set; }
        
        public bool infoVisible { get; set; }

        public string infoTitle { get; set; }

        public string infoText { get; set; }

        public string infoUrl { get; set; }

        public string infoUrlText { get; set; }

        public string infoOwner { get; set; }

        public int? zIndex { get; set; }
    }
}
