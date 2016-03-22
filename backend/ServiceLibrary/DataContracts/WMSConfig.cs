using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sweco.Services.DataContracts
{
    public class WMSConfig
    {
        public string id { get; set; }

        public string caption { get; set; }

        public string url { get; set; }

        public string owner { get; set; }

        public string date { get; set; }

        public string content { get; set; }

        public string legend { get; set; }

        public string[] layers { get; set; }

        public string infobox { get; set; }

        public string[] searchFields { get; set; }

        public bool visibleAtStart { get; set; }

        public int drawOrder { get; set; }
    }
}
