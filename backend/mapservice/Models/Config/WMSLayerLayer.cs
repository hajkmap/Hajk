using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MapService.Models.Config
{
    public class WMSLayerLayer
    {
        public string infobox { get; set; }
        public string style { get; set; }
        public bool queryable { get; set; }
        public string legend { get; set; }
        public string name { get; set; }
    }
}