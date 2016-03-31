using GeoAPI.Geometries;
using NetTopologySuite.Geometries;
using SharpMap;
using SharpMap.Data;
using SharpMap.Layers;
using SharpMap.Rendering.Thematics;
using SharpMap.Styles;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace Sweco.Services.MapExport
{
    public class MapExporter
    {
        /// <summary>
        /// Gets or sets the SharpMap map to export.
        /// </summary>
        public Map map { get; set; }
        
        /// <summary>
        /// Property exportItem
        /// </summary>
        private MapExportItem exportItem;

        /// <summary>
        /// Delegate to create style per feature based by style attribute.
        /// </summary>
        /// <param name="row"></param>
        /// <returns>IStyle Vector style to use for this feature</returns>
        private IStyle GetFeatureStyle(FeatureDataRow row)
        {                        
            VectorStyle style = new VectorStyle();
            if (row["style"] != null)
            {
                Style featureStyle = (Style)row["style"];
                style.EnableOutline = true;

                style.Line.Color = ColorTranslator.FromHtml(featureStyle.strokeColor);
                style.Line.Width = (float)featureStyle.strokeWidth;
                style.Line.SetLineCap(LineCap.Round, LineCap.Round, DashCap.Round);

                switch (featureStyle.strokeDashstyle) {
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
                       style.Line.DashPattern = new float[] { 8, 2 , 1, 2 };
                       break;
                    default:                       
                       style.Line.DashStyle = DashStyle.Solid;
                       break;
                }

                style.Outline = style.Line;

                Color color = ColorTranslator.FromHtml(featureStyle.fillColor);
                Color pointColor = ColorTranslator.FromHtml(featureStyle.pointFillColor); 

                if (featureStyle.fillOpacity != null) {
                    int opac = (int)(255 * featureStyle.fillOpacity);
                    Color transparent = Color.FromArgb(opac, color);
                    style.Fill = new SolidBrush(transparent);                    
                } else {
                    style.Fill = new SolidBrush(color);                                      
                }

                if (featureStyle.pointSrc != "")
                {
                    try
                    {                        
                        WebClient wc = new WebClient();
                        byte[] bytes = wc.DownloadData(featureStyle.pointSrc);
                        MemoryStream ms = new MemoryStream(bytes);
                        Image img = Image.FromStream(ms);
                        style.Symbol = img;
                    }
                    catch
                    {
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
        private IStyle GetLabelStyle(FeatureDataRow row)
        {
            Style featureStyle = (Style)row["style"];
            LabelStyle labelStyle = new SharpMap.Styles.LabelStyle();            
            
            if (featureStyle.fontSize == null)
            {
                return labelStyle;
            }
            
            labelStyle.ForeColor = ColorTranslator.FromHtml(featureStyle.fontColor);            
            labelStyle.Font = new Font(FontFamily.GenericSansSerif, Int32.Parse(featureStyle.fontSize), FontStyle.Bold);
            
            labelStyle.HorizontalAlignment = SharpMap.Styles.LabelStyle.HorizontalAlignmentEnum.Center;
            labelStyle.VerticalAlignment = SharpMap.Styles.LabelStyle.VerticalAlignmentEnum.Middle;
            
            labelStyle.Offset = new PointF(0, -10);
            labelStyle.Halo = new Pen(Color.Black, 2);
            labelStyle.VerticalAlignment = LabelStyle.VerticalAlignmentEnum.Bottom;
            
            labelStyle.CollisionDetection = false;
            labelStyle.IgnoreLength = true;            

            return labelStyle;
        }

        /// <summary>
        /// Create a new ExportMap object.
        /// </summary>
        /// <param name="exportItem"></param>
        public MapExporter(MapExportItem exportItem) 
        {
            this.exportItem = exportItem;            
            this.map = new Map(new Size(exportItem.size[0], exportItem.size[1]));
        }

        /// <summary>
        /// Add a list of wms layers to the map.
        /// </summary>
        /// <param name="wmsLayers"></param>
        public void AddWMSLayers (List<WMSInfo> wmsLayers)
        {
            wmsLayers = wmsLayers.OrderBy(layer => layer.zIndex).ToList();
            try
            {                
                for (int i = 0; i < wmsLayers.Count; i++)            
                {                    
                    string layername = "WMSLayer_" + i;                    
                    WmsLayer layer = new WmsLayer(layername, wmsLayers[i].url);
                    layer.SetImageFormat("image/png");
                    layer.BgColor = Color.White;
                    layer.Transparent = true;
                    layer.Version = "1.1.0";
                    layer.ContinueOnError = true;
                    for (int t = 0; t < wmsLayers[i].layers.Count; t++)
                    {
                        string sublayerName = "";
                        try
                        {
                            sublayerName = wmsLayers[i].workspacePrefix != null ? 
                                           wmsLayers[i].workspacePrefix + ":" + wmsLayers[i].layers[t] :
                                           wmsLayers[i].layers[t];

                            if (sublayerName != "")
                            {
                                layer.AddLayer(sublayerName);
                            }
                        }
                        catch
                        {                            
                        }
                    }
                
                    layer.SRID = wmsLayers[i].coordinateSystemId;
                    map.Layers.Add(layer);                
                }                
            }
            catch
            {                
            }
        }
        
        /// <summary>        
        /// /// Add a list of vector layers to the map.
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
      
                    feature.coordinates.ForEach(coordinate =>                            
                    {
                        double x = coordinate[0];
                        double y = coordinate[1];
                        vertices.Add((new GeoAPI.Geometries.Coordinate(x, y)));
                    });

                    switch (feature.type)
                    {
                        case "Text":
                        case "Point":       
                            if (vertices.Count > 0) {                                
                                var point = factory.CreatePoint(new GeoAPI.Geometries.Coordinate(vertices[0]));                                
                                dataRow.Geometry = point;                                                                                                            
                            }
                            break;
                        case "LineString":        
                            var lineString = factory.CreateLineString(vertices.ToArray());                            
                            dataRow.Geometry = lineString;                                                                           
                            break;
                        case "Polygon":    
                            var polygon = factory.CreatePolygon(vertices.ToArray());                            
                            dataRow.Geometry = polygon;
                            break;                                                   
                    }

                    featureData.AddRow(dataRow);                        
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
                labels.SmoothingMode = SmoothingMode.AntiAlias;
                labels.SRID = vectorLayer.SRID;                
                                
                labels.Style.CollisionDetection = false;                

                map.Layers.Add(labels);

                counter++;
            });
            
        }
    }
}
