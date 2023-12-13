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

        public string internalLayerName { get; set; }

        public string url { get; set; }

		public string uri { get; set; }

		public string projection { get; set; }

        public string geometryField { get; set; }

        public List<string> layers { get; set; }

        public List<EditableField> editableFields { get; set; }

        public List<EditableField> nonEditableFields { get; set; }

        public bool editPoint{ get; set; }

        public bool editMultiPoint { get; set; }

        public bool editPolygon { get; set; }

        public bool editMultiPolygon { get; set; }

        public bool editLine { get; set; }

        public bool editMultiLine { get; set; }

        public bool infoVisible { get; set; }

        public string infoTitle { get; set; }

        public string infoText { get; set; }

        public string infoUrl { get; set; }

        public string infoUrlText { get; set; }

        public string infoOwner { get; set; }

        public int? zIndex { get; set; }
    }
}
