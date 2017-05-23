using System;
using System.Collections.ObjectModel;
using System.Drawing;
using GeoAPI.Geometries;
using SharpMap.Layers;

namespace MapService.Components.MapExport {

    public class DpiWmsLayer : WmsLayer
    {

        // Defined due to internal workings of WmsLayer
        private readonly Collection<string> _layerList;
        private readonly Collection<string> _stylesList;
        private readonly string _mimeType;
        private readonly Color _bgColor = Color.White;
        private readonly int _ogcStandardDpi = 90;
        private readonly int _requestedDpi;

        private const string GeoserverDpi = "FORMAT_OPTIONS=dpi:";
        private const string UMNDpi = "MAP_RESOLUTION=";
        private const string QGISDpi = "DPI=";

        public DpiWmsLayer(string layername, string url, int dpi = 90) : base(layername, url)
        {
            _requestedDpi = dpi;
        }

        public override string GetRequestUrl(Envelope box, Size size)
        {
            var requestUrl = base.GetRequestUrl(box, size);

            return requestUrl + string.Format("&{0}{3}&{1}{3}&{2}{3}", 
                GeoserverDpi,
                UMNDpi,
                QGISDpi,
                _requestedDpi);
        }

    }
}