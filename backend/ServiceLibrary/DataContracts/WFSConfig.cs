using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sweco.Services.DataContracts
{
    public class WFSConfig
    {
        public string id { get; set; }

        public string caption { get; set; }

        public string url { get; set; }
        
        public string[] layers { get; set; }        

        public string[] searchFields { get; set; }
        
        public string[] displayFields { get; set; }

        public string outputFormat { get; set; }
    }
}
