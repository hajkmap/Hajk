using MapService.Components.MapExport;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using BAMCIS.GeoJSON;

namespace MapService.Models.Config
{

    public class VectorConfig : ILayerConfig
    {
        public FeatureInfo AsInfo(int coordinateSystemId, int zIndex)
        {
            FeatureInfo featureInfo = new FeatureInfo();
            List<Components.MapExport.Feature> features = this.Load(this.url);
            featureInfo.features = features;
            return featureInfo;
        }

        public List<Components.MapExport.Feature> Load(string url)
        {
            List<Components.MapExport.Feature> features = new List<Components.MapExport.Feature>();
            url += String.Format("?service=WFS&version=1.0.0&request=GetFeature&typeName={0}&maxFeatures=100000&outputFormat=application%2Fjson", layer);

            WebRequest request = WebRequest.Create(url);
            WebResponse response = request.GetResponse();
            using (Stream dataStream = response.GetResponseStream())
            {
                StreamReader reader = new StreamReader(dataStream);
                string responseFromServer = reader.ReadToEnd();
                FeatureCollection jsonFeatures = JsonConvert.DeserializeObject<FeatureCollection>(responseFromServer);                
                jsonFeatures.Features.Select(feature =>
                {
                    Components.MapExport.Feature f = new Components.MapExport.Feature();
                    f.type = feature.Type.ToString();
                    if (feature.Type == GeoJsonType.Point)
                    {
                        Point p = feature.Geometry as Point;
                        f.coordinates = new List<double[]>();
                        f.coordinates.Add(new double[]
                        {
                            p.Coordinates.Latitude,
                            p.Coordinates.Longitude
                        });
                    }

                    if (feature.Type == GeoJsonType.LineString)
                    {
                        LineString l = feature.Geometry as LineString;
                        f.coordinates = l.Coordinates.Select(p =>
                        {
                            return new double[] {
                                p.Latitude,
                                p.Longitude
                            };
                        }).ToList();
                    }

                    return f;
                });
            }
            return features;
        }

        public string id { get; set; }

        public string dataFormat { get; set; }

        public string caption { get; set; }

        public string url { get; set; }

        public string layer { get; set; }

        public string owner { get; set; }

        public string date { get; set; }

        public string content { get; set; }

        public string legend { get; set; }

        public double symbolXOffset { get; set; }

        public double symbolYOffset { get; set; }

        public string projection { get; set; }

        public string pointSize { get; set; }

        public string filterAttribute { get; set; }

        public string filterValue { get; set; }

        public string filterComparer { get; set; }

        public string lineStyle { get; set; }

        public string lineWidth { get; set; }

        public string lineColor { get; set; }

        public string fillColor { get; set; }

        public bool visibleAtStart { get; set; }

        public double opacity { get; set; }

        public string infobox { get; set; }

        public bool queryable { get; set; }

        public bool filterable { get; set; }

        public string labelAlign { get; set; }

        public string labelBaseline { get; set; }

        public string labelSize { get; set; }

        public int labelOffsetX { get; set; }

        public int labelOffsetY { get; set; }

        public string labelWeight { get; set; }

        public string labelFont { get; set; }

        public string labelFillColor { get; set; }

        public string labelOutlineColor { get; set; }

        public int labelOutlineWidth { get; set; }

        public string labelAttribute { get; set; }

        public bool showLabels { get; set; }

        public bool infoVisible { get; set; }

        public string infoTitle { get; set; }

        public string infoText { get; set; }

        public string infoUrl { get; set; }

        public string infoUrlText { get; set; }

        public string infoOwner { get; set; }

        public int? zIndex { get; set; }
    }
}
