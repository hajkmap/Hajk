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
using System.Text.RegularExpressions;
using System.Globalization;

namespace MapService.Models.Config
{

    public class Colores
    {
        public string hex { get; set; }

        public double opacity { get; set; }

        public Colores fromRGBA(string rgba)
        {
            if (!Regex.IsMatch(rgba, @"rgba\((\d{1,3},\s*){3}(0(\.\d+)?|1)\)"))
            {
                return new Colores()
                {
                    hex = rgba,
                    opacity = 1
                };
            }

            double opacity = 1;
            var matches = Regex.Matches(rgba, @"[\d\.]+");
            StringBuilder hex = new StringBuilder("#");
            for (int i = 0; i < matches.Count; i++)
            {
                if (i < 3)
                {
                    int value = Int32.Parse(matches[i].Value);
                    string v = value.ToString("X");
                    if (value.ToString("X").Length == 1)
                    {
                        v = "0" + v;
                    }
                    hex.Append(v);
                }
                else
                {
                    opacity = Double.Parse(matches[i].Value, CultureInfo.InvariantCulture);
                }
            }
            return new Colores()
            {
                hex = hex.ToString(),
                opacity = opacity
            };
        }        
    }

    public class VectorConfig : ILayerConfig
    {        
        public List<Components.MapExport.Feature> Load(string url, int srs, double[] extent)
        {
            List<Components.MapExport.Feature> features = new List<Components.MapExport.Feature>();
            string bbox = string.Join(",", extent.Select(p => p.ToString(CultureInfo.InvariantCulture)));
            url += String.Format("?service=WFS&version=1.0.0&request=GetFeature&typeName={0}&srsName=EPSG:{1}&maxFeatures=100000&outputFormat=application%2Fjson&bbox={2},urn:ogc:def:crs:EPSG:{3}", layer, srs, bbox, srs);

            WebRequest request = WebRequest.Create(url);
            WebResponse response = request.GetResponse();
            using (Stream dataStream = response.GetResponseStream())
            {
                StreamReader reader = new StreamReader(dataStream);
                string responseFromServer = reader.ReadToEnd();
                FeatureCollection jsonFeatures = JsonConvert.DeserializeObject<FeatureCollection>(responseFromServer);

                features = jsonFeatures.Features.Select(feature =>
                {
                    Components.MapExport.Feature f = new Components.MapExport.Feature();

                    f.properties = feature.Properties;
                    f.type = feature.Geometry.Type.ToString();
                    f.coordinates = this.getCoordinates(feature);
                    f.holes = this.getHoles(feature);

                    return f;

                }).ToList();
            }
            return features;
        }

        private List<double[]> getCoordinates(BAMCIS.GeoJSON.Feature feature)
        {
            List<double[]> coordinates = new List<double[]>();

            switch (feature.Geometry.Type)
            {
                case GeoJsonType.Point:
                    Point p = feature.Geometry as Point;
                    coordinates.Add(new double[] 
                    {
                        p.Coordinates.Longitude,
                        p.Coordinates.Latitude,
                    });                    
                    return coordinates;                    

                case GeoJsonType.LineString:
                    LineString lineString = feature.Geometry as LineString;
                    coordinates = lineString.Coordinates.Select(coord => new double[] {
                        coord.Longitude,
                        coord.Latitude
                    }).ToList();
                    return coordinates;

                case GeoJsonType.Polygon:
                    Polygon polygon = feature.Geometry as Polygon;
                    LinearRing outline = polygon.Coordinates.FirstOrDefault();
                    coordinates = outline.Coordinates.Select(coord => new double[] {
                        coord.Longitude,
                        coord.Latitude
                    }).ToList();
                    return coordinates;

                default:
                    return coordinates;
            }
        }

        public List<List<double[]>> getHoles(BAMCIS.GeoJSON.Feature feature)
        {
            List<List<double[]>> holes = new List<List<double[]>>();
            if (feature.Geometry.Type == GeoJsonType.Polygon)
            {                
                Polygon polygon = feature.Geometry as Polygon;
                IEnumerable<LinearRing> innerRings = polygon.Coordinates.Skip(1);                
                holes = innerRings.Select(r => r.Coordinates.Select(c => new double[] {
                    c.Longitude,
                    c.Latitude
                }).ToList()).ToList();
            }
            return holes;
        }
        
        public string attribution { get; set; }
        public string caption { get; set; }
        public string internalLayerName { get; set; }
        public string content { get; set; }
        public string dataFormat { get; set; }
        public string date { get; set; }
        public string filterAttribute { get; set; }
        public string filterComparer { get; set; }
        public string filterValue { get; set; }
        public bool   filterable { get; set; }
        public string id { get; set; }
        public string infoOwner { get; set; }
        public string infoText { get; set; }
        public string infoTitle { get; set; }
        public string infoUrl { get; set; }
        public string infoUrlText { get; set; }
        public bool   infoVisible { get; set; }
        public string infobox { get; set; }
        public bool   timeSliderVisible { get; set; }
        public string timeSliderStart { get; set; }
        public string timeSliderEnd { get; set; }
        public string layer { get; set; }
        public string legend { get; set; }
        public string legendIcon { get; set; }
        public int    maxZoom { get; set; }
        public int    minZoom { get; set; }
        public string infoClickSortType { get; set; }
        public bool   infoClickSortDesc { get; set; }
        public string infoClickSortProperty { get; set; }        
        public double opacity { get; set; }
        public string projection { get; set; }
        public bool   queryable { get; set; }
        public string sldStyle { get; set; }       
        public string sldText { get; set; }       
        public string sldUrl { get; set; }
        public string url { get; set; }
        public string version { get; set; }
        public bool   visibleAtStart { get; set; }

        public bool hideExpandArrow { get; set; }
        public int?   zIndex { get; set; }

    }
}
