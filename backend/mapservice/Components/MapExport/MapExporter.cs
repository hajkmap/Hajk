using GeoAPI.Geometries;
using NetTopologySuite.Geometries;
using SharpMap;
using SharpMap.Data;
using SharpMap.Data.Providers;
using SharpMap.Layers;
using SharpMap.Rendering.Thematics;
using SharpMap.Styles;
using SharpMap.Rendering.Decoration;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;
using GeoAPI;
using BruTile;
using BruTile.Wmts;
using BruTile.Web;
using NetTopologySuite.Features;
using System.Threading;
using System.Web;
using MapService.Components.MapExport.Extentions;
using MapService.Components.MapExport.SharpMapExtensions;
using log4net;
using System.Configuration;

namespace MapService.Components.MapExport
{
    public class MapExporter
    {
        ILog _log = LogManager.GetLogger(typeof(MapExporter));

        /// <summary>
        /// Gets or sets the SharpMap map to export.
        /// </summary>
        public MapThrowsException map { get; set; }

        /// <summary>
        /// Property exportItem
        /// </summary>
        private MapExportItem exportItem;

        /// <summary>
        /// Delegate to create style per feature based by style attribute.
        /// </summary>
        /// <param name="row"></param>
        /// <returns>IStyle Vector style to use for this feature</returns>
        private IStyle GetFeatureStyle(IFeature feature)
        {
            FeatureDataRow row = (FeatureDataRow)feature;
            VectorStyle style = new VectorStyle();
            if (row["style"] != null)
            {
                Style featureStyle = (Style)row["style"];
                style.EnableOutline = true;

                style.Line.Color = ColorTranslator.FromHtml(featureStyle.strokeColor);
                style.Line.Width = (float)featureStyle.strokeWidth;
                style.Line.SetLineCap(LineCap.Round, LineCap.Round, DashCap.Round);

                switch (featureStyle.strokeDashstyle)
                {
                    case "dot":
                        style.Outline.DashStyle = DashStyle.Dot;
                        style.Line.DashStyle = DashStyle.Dot;
                        break;
                    case "solid":
                        style.Line.DashStyle = DashStyle.Solid;
                        break;
                    case "dash":
                        style.Line.DashStyle = DashStyle.Dash;
                        break;
                    case "dashdot":
                        style.Line.DashStyle = DashStyle.DashDot;
                        break;
                    case "longdash":
                        style.Line.DashStyle = DashStyle.DashDot;
                        style.Line.DashPattern = new float[] { 8, 2 };
                        break;
                    case "longdashdot":
                        style.Line.DashStyle = DashStyle.DashDot;
                        style.Line.DashPattern = new float[] { 8, 2, 1, 2 };
                        break;
                    default:
                        style.Line.DashStyle = DashStyle.Solid;
                        break;
                }

                style.Outline = style.Line;

                Color color = ColorTranslator.FromHtml(featureStyle.fillColor);
                Color pointColor = ColorTranslator.FromHtml(featureStyle.pointFillColor);

                if (featureStyle.fillOpacity != null)
                {
                    int opac = (int)(255 * featureStyle.fillOpacity);
                    Color transparent = Color.FromArgb(opac, color);
                    style.Fill = new SolidBrush(transparent);
                }
                else
                {
                    style.Fill = new SolidBrush(color);
                }

                _log.DebugFormat("Feature pointSrc = {0}", featureStyle.pointSrc);
                if (featureStyle.pointSrc != "")
                {
                    try
                    {
                        _log.Debug("start download");
                        WebClient wc = new WebClient();
                        _log.Debug("start download1");
                        byte[] bytes = wc.DownloadData(featureStyle.pointSrc);
                        _log.Debug("start download2");
                        MemoryStream ms = new MemoryStream(bytes);
                        _log.Debug("start download3");
                        Image img = Image.FromStream(ms);
                        _log.Debug("start download4");
                        style.Symbol = img;
                        _log.Debug("start download5");
                    }
                    catch (Exception ex)
                    {
                        _log.DebugFormat("Could not get icon: {0}", ex.ToString());
                    }
                }
                else
                {
                    style.PointColor = new SolidBrush(pointColor);
                    style.PointSize = (float)featureStyle.pointRadius * 2;
                }

            }
            return style;
        }

        /// <summary>
        /// Delegate to create label style per feature based by style attribute.
        /// </summary>
        /// <param name="row"></param>
        /// <returns>IStyle Vector style to use for this feature</returns>
        private IStyle GetLabelStyle(IFeature feature)
        {
            FeatureDataRow row = (FeatureDataRow)feature;
            Style featureStyle = (Style)row["style"];
            LabelStyle labelStyle = new SharpMap.Styles.LabelStyle();

            if (featureStyle.fontSize == null)
            {
                return labelStyle;
            }
            
            labelStyle.ForeColor = ColorTranslator.FromHtml(featureStyle.fontColor);            
            labelStyle.BackColor = new SolidBrush(ColorTranslator.FromHtml(featureStyle.fontBackColor));            
            labelStyle.Font = new Font(FontFamily.GenericSansSerif, Int32.Parse(featureStyle.fontSize), FontStyle.Bold);
            labelStyle.Halo = new Pen(Color.Black, 2);
            labelStyle.IsTextOnPath = true;
            labelStyle.CollisionDetection = false;
            labelStyle.IgnoreLength = false;

            return labelStyle;
        }

        /// <summary>
        /// Create tile source
        /// </summary>
        /// <param name="config"></param>
        /// <returns></returns>
        private ITileSource createTileSource(WMTSInfo config)
        {
            Uri uri = new Uri(string.Format("{0}{1}", config.url, "?request=getCapabilities"));

            var req = WebRequest.Create(uri);
            var resp = req.GetResponseAsync();
            ITileSource tileSource;

            using (var stream = resp.Result.GetResponseStream())
            {
                IEnumerable<ITileSource> tileSources = WmtsParser.Parse(stream);
                tileSource = tileSources.FirstOrDefault();
            }
            return tileSource;
        }

        /// <summary>
        /// Create a new ExportMap object.
        /// </summary>
        /// <param name="exportItem"></param>
        public MapExporter(MapExportItem exportItem)
        {
            this.exportItem = exportItem;
            var size = new Size(exportItem.size[0], exportItem.size[1]);

            Map.Configure();
            this.map = new MapThrowsException(size);            
        }

        /// <summary>
        /// Add a list of wms layers to the map.
        /// </summary>
        /// <param name="wmsLayers"></param>
        public void AddWMSLayers(List<WMSInfo> wmsLayers)
        {
            wmsLayers = wmsLayers.OrderBy(layer => layer.zIndex).ToList();
            try
            {

                //string path = @"C:\\log.txt";
                //StreamWriter file = new StreamWriter(path, true);
                
                //file.WriteLine("Starting to add layers");
                for (int i = 0; i < wmsLayers.Count; i++)
                {
                    //file.WriteLine("Found a layer");
                    string layername = "WMSLayer_" + i;

                    DpiWmsLayer layer = new DpiWmsLayer(layername, wmsLayers[i].url , exportItem.resolution);
                    
                    layer.SetImageFormat("image/png");
                    layer.BgColor = Color.White;
                    layer.Transparent = true;
                    layer.Version = wmsLayers[i].version;
                    layer.ContinueOnError = false;
                    for (int t = 0; t < wmsLayers[i].layers.Count; t++)
                    {
                        //file.WriteLine("Found a sublayer");
                        string sublayerName = "";
                        try
                        {
                            // Do not use workspace prefix, will return error
                            sublayerName = wmsLayers[i].workspacePrefix != null ?
                                           wmsLayers[i].workspacePrefix + ":" + wmsLayers[i].layers[t] :
                                           wmsLayers[i].layers[t];
                            //file.WriteLine("sublayername '" + sublayerName + "'");
                            if (sublayerName != "")
                            {
                                layer.AddLayer(sublayerName);
                                layer.AddStyle(wmsLayers[i].styles);
                            }
                        }
                        catch (Exception ex)
                        {
                            // TODO
                            //file.WriteLine("Error in adding subname.\n" + ex.ToString());
                            _log.ErrorFormat("Error in AddWMSLayers: {0}", ex.Message);
                        }
                    }
                    layer.SRID = wmsLayers[i].coordinateSystemId;
                    //file.WriteLine("Adding layer");
                    //file.Close();
                    map.Layers.Add(layer);
                    //using (StreamWriter sw = new StreamWriter(@"C:\\log.txt", true))
                    //{
                    //    sw.WriteLine("Layer added");
                    //}
                }
            }
            catch (Exception e)
            {

                _log.ErrorFormat("Error2 in AddWMSLayers: {0}", e.Message);
                /*
                using (StreamWriter sw = new StreamWriter(@"C:\\log.txt", true))
                {
                    sw.WriteLine("Got an error in add layers");
                }
                */
                // TODO
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="wmtsLayers"></param>
        public void AddWMTSLayers(List<WMTSInfo> wmtsLayers)
        {
            if (wmtsLayers != null && wmtsLayers.Count > 0)
            {
                List<TileLayer2> layers = new List<TileLayer2>();
                int i = 0;
                wmtsLayers.ForEach((layer) =>
                {
                    var tileSource = this.createTileSource(layer);                    
                    TileLayer2 wmtsLayer = new TileLayer2(tileSource, "wmts_layer_" + i)
                    {
                        Resolution = this.exportItem.resolution
                    };
                    layers.Add(wmtsLayer);
                    map.BackgroundLayer.Add(wmtsLayer);                    
                    i++;
                });
            }
        }

        /// <summary>        
        /// Add a list of vector layers to the map.
        /// </summary>
        /// <param name="vectorLayers"></param>
        public void AddVectorLayers(List<FeatureInfo> vectorLayers)
        {
            int counter = 0;
            if (vectorLayers == null) return;
            vectorLayers.ForEach(layer => {

                VectorLayer vectorLayer = new VectorLayer("VectorLayer-" + counter);
                GeometryFactory factory = new GeometryFactory();
                List<IGeometry> geometries = new List<IGeometry>();

                FeatureDataTable featureData = new FeatureDataTable();
                featureData.Columns.Add("text", typeof(String));
                featureData.Columns.Add("style", typeof(MapExport.Style));

                layer.features.ForEach(feature =>
                {
                    FeatureDataRow dataRow = featureData.NewRow();
                    dataRow["text"] = feature.attributes.text;
                    dataRow["style"] = feature.attributes.style;

                    List<GeoAPI.Geometries.Coordinate> vertices = new List<GeoAPI.Geometries.Coordinate>();
                    List<List<GeoAPI.Geometries.Coordinate>> holes = new List<List<GeoAPI.Geometries.Coordinate>>();

                    feature.coordinates.ForEach(coordinate =>
                    {
                        double x = coordinate[0];
                        double y = coordinate[1];
                        vertices.Add((new GeoAPI.Geometries.Coordinate(x, y)));
                    });

                    if (feature.holes != null)
                    {
                        feature.holes.ForEach(hole =>
                        {
                            var coords = new List<Coordinate>();
                            hole.ForEach(coordinate =>
                            {
                                double x = coordinate[0];
                                double y = coordinate[1];
                                coords.Add((new GeoAPI.Geometries.Coordinate(x, y)));
                            });
                            holes.Add(coords);
                        });
                    }

                    bool created = false;

                    switch (feature.type)
                    {
                        case "Text":                        
                        case "Point":
                        case "MultiPoint":
                            if (vertices.Count > 0)
                            {
                                var point = factory.CreatePoint(new GeoAPI.Geometries.Coordinate(vertices[0]));
                                dataRow.Geometry = point;
                            }
                            created = true;
                            break;                        
                        case "LineString":
                        case "MultiLineString":
                            var lineString = factory.CreateLineString(vertices.ToArray());
                            dataRow.Geometry = lineString;
                            created = true;
                            break;                                                
                        case "Polygon":                                              
                            var polygon = factory.CreatePolygon(vertices.ToArray());
                            dataRow.Geometry = polygon;
                            created = true;
                            break;
                        case "MultiPolygon":
                            ILinearRing outer = LinearRing.DefaultFactory.CreateLinearRing(vertices.ToArray());
                            ILinearRing[] inners = holes.Select(h =>
                            {
                                return LinearRing.DefaultFactory.CreateLinearRing(h.ToArray());
                            }).ToArray();
                            var multiPolygon = factory.CreatePolygon(outer, inners);
                            dataRow.Geometry = multiPolygon;
                            created = true;
                            break;
                        case "Circle":
                            var circle = factory.CreatePoint(new GeoAPI.Geometries.Coordinate(vertices[0]));                            
                            dataRow.Geometry = circle.Buffer(vertices[1][0]);                            
                            created = true;
                            break;
                    }
                    if (created)
                    {
                        featureData.AddRow(dataRow);
                    }                    
                });

                vectorLayer.DataSource = new SharpMap.Data.Providers.GeometryFeatureProvider(featureData);                                  
                vectorLayer.Theme = new CustomTheme(GetFeatureStyle);

                map.Layers.Add(vectorLayer);

                LabelLayer labels = new LabelLayer("Labels");

                labels.DataSource = vectorLayer.DataSource;
                labels.Enabled = true;
                labels.LabelColumn = "text";
                labels.Theme = new CustomTheme(GetLabelStyle);
                labels.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAlias;
                labels.SmoothingMode = SmoothingMode.HighQuality;
                labels.SRID = vectorLayer.SRID;

                map.Layers.Add(labels);
                counter++;
            });

        }

        /// <summary>
        /// Add a list of ArcGIS layers to the map.
        /// </summary>
        /// <param name="argisLayers"></param>
        public void AddArcGISLayers(List<ArcGISInfo> argisLayers)
        {
            if (argisLayers != null)
            {
                argisLayers.ForEach(layer =>
                {
                    Envelope envelope = new Envelope(
                        layer.extent.left,
                        layer.extent.right,
                        layer.extent.bottom,
                        layer.extent.top
                    );
                    if (layer.layers.Length > 0)
                    {
                        ArcGISLayer arcGisLayer = new ArcGISLayer(envelope, layer.url, layer.layers, layer.spatialReference);
                        map.Layers.Add(arcGisLayer);
                    }
                });
            }
        }

        /// <summary>
        /// Get label style
        /// </summary>
        /// <param name="row"></param>
        /// <returns></returns>
        private IStyle GetLabelStyle(FeatureDataRow row)
        {
            Style featureStyle = (Style)row["style"];
            LabelStyle labelStyle = new SharpMap.Styles.LabelStyle();

            if (featureStyle.fontSize == null)
            {
                return labelStyle;
            }

            labelStyle.ForeColor = ColorTranslator.FromHtml(featureStyle.fontColor);
            if (featureStyle.fontBackColor != null) {
                //labelStyle.BackColor = new SolidBrush(ColorTranslator.FromHtml(featureStyle.fontBackColor));                
                labelStyle.Halo = new Pen(ColorTranslator.FromHtml(featureStyle.fontBackColor), 2);
            }

            labelStyle.Font = new Font(FontFamily.GenericSansSerif, Int32.Parse(featureStyle.fontSize), FontStyle.Bold);            
            labelStyle.IsTextOnPath = true;
            labelStyle.CollisionDetection = false;
            labelStyle.IgnoreLength = false;

            return labelStyle;
        }

        /// <summary>
        /// Convert byte array to image
        /// </summary>
        /// <param name="bytes"></param>
        /// <returns></returns>
        private Image ImageFromBytes(byte[] bytes)
        {
            using (MemoryStream ms = new MemoryStream(bytes))
            {
                Image img = Image.FromStream(ms);
                return img;
            }            
        }

        /// <summary>
        /// Get feature style
        /// </summary>
        /// <param name="row"></param>
        /// <returns></returns>
        private IStyle GetFeatureStyle(FeatureDataRow row)
        {
            _log.Debug("GetFeatureStyle");
            VectorStyle style = new VectorStyle();
            if (row["style"] != null)
            {
                Style featureStyle = (Style)row["style"];
                style.EnableOutline = true;

                style.Line.Color = ColorTranslator.FromHtml(featureStyle.strokeColor);
                style.Line.Width = (float)featureStyle.strokeWidth;
                style.Line.SetLineCap(LineCap.Round, LineCap.Round, DashCap.Round);

                switch (featureStyle.strokeDashstyle)
                {
                    case "dot":
                        style.Outline.DashStyle = DashStyle.Dot;
                        style.Line.DashStyle = DashStyle.Dot;
                        break;
                    case "solid":
                        style.Line.DashStyle = DashStyle.Solid;
                        break;
                    case "dash":
                        style.Line.DashStyle = DashStyle.Dash;
                        break;
                    case "dashdot":
                        style.Line.DashStyle = DashStyle.DashDot;
                        break;
                    case "longdash":
                        style.Line.DashStyle = DashStyle.DashDot;
                        style.Line.DashPattern = new float[] { 8, 2 };
                        break;
                    case "longdashdot":
                        style.Line.DashStyle = DashStyle.DashDot;
                        style.Line.DashPattern = new float[] { 8, 2, 1, 2 };
                        break;
                    default:
                        style.Line.DashStyle = DashStyle.Solid;
                        break;
                }

                style.Outline = style.Line;

                Color color = ColorTranslator.FromHtml(featureStyle.fillColor);
                Color pointColor = ColorTranslator.FromHtml(featureStyle.pointFillColor);

                if (featureStyle.fillOpacity != null)
                {
                    int opac = (int)(255 * featureStyle.fillOpacity);
                    Color transparent = Color.FromArgb(opac, color);
                    style.Fill = new SolidBrush(transparent);
                }
                else
                {
                    style.Fill = new SolidBrush(color);
                }

                _log.DebugFormat("Featurestyle.pointSrc = {0}", featureStyle.pointSrc);
                if (featureStyle.pointSrc != "")
                {
                    if (featureStyle.pointSrc.StartsWith("data:"))
                    {
                        string src = featureStyle.pointSrc.Split(',').Last();
                        byte[] bytes = Convert.FromBase64String(src);
                        style.Symbol = this.ImageFromBytes(bytes);
                    }
                    else
                    {
                        try
                        {
                            string url = HttpContext.Current.Request.Url.Authority;
                            string protocol = "";

                            if (HttpContext.Current.Request.IsSecureConnection)
                            {
                                 protocol = "https://";
                            }
                            else
                            {
                                 protocol = "http://";
                            }
                            
                            _log.DebugFormat("url: {0}", url);
                            WebClient wc = new WebClient();
                            byte[] bytes = wc.DownloadData(protocol + url + "/" + featureStyle.pointSrc);                            
                            style.Symbol = this.ImageFromBytes(bytes);                            
                        }
                        catch (Exception ex)
                        {
                            //TODO
                            _log.ErrorFormat("Exception when trying to get icon: {0}", ex.ToString());
                        }
                    }
                }
                else
                {
                    style.PointColor = new SolidBrush(pointColor);
                    style.PointSize = (float)featureStyle.pointRadius * 2;
                }

            }
            return style;
        }
    }
}