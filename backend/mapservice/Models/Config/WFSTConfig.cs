using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Models.Config
{
    public enum EditableGeometryType
    {
        Point,
        LineString,
        Polygon
    };

    public class WFSTConfig : ILayerConfig
    {
        public string id { get; set; }

        public string caption { get; set; }

        public string url { get; set; }

        public string projection { get; set; }

        public List<string> layers { get; set; }

        public List<EditableField> editableFields { get; set; }

        public bool editPoint{ get; set; }

        public bool editPolygon { get; set; }

        public bool editLine { get; set; }        
    }
}
