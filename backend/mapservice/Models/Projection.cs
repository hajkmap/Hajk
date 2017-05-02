using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Models
{
    public class Projection
    {
        public string code { get; set; }

        public string definition { get; set; }

        public double[] extent { get; set; }

        public string units { get; set; }        
    }
}
