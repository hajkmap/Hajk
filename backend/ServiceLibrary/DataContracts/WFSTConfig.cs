using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sweco.Services.DataContracts
{
    public class WFSTConfig
    {
        public string id { get; set; }

        public string caption { get; set; }

        public string url { get; set; }

        public string projection { get; set; }

        public List<string> layers { get; set; }

        public List<EditableField> editableFields { get; set; }
    }
}
