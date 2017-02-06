using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Models
{
    public class EditableField
    {
        public int index { get; set; }

        public string name { get; set; }

        public string dataType { get; set; }

        public string textType { get; set; }

        public string[] values { get; set; }

        public bool hidden { get; set; }

        public string defaultValue { get; set; }
    }
}
