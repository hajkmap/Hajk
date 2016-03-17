using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sweco.Services.DataContracts
{
    public class MapSetting
    {
        public string target { get; set; }        
        public int[] center { get; set; }
        public string projection { get; set; }
        public int zoom { get; set; }
    }
}
