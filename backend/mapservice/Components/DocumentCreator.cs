using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Hosting;
using System.IO;
using IronPdf;
using iTextSharp.text;
using iTextSharp.text.pdf;
using System.Net.Http;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using iTextSharp.text.pdf.parser;
using MapService.Models.Config;
using MapService.Components.MapExport;
using MapService.Models;
using System.Threading.Tasks;
using System.Threading;

namespace MapService.Components
{       
    public class MapSettings
    {
        public double[] extent { get; set; }
        public double[] center { get; set; }
    }

    public class Chapter
    {
        public string header { get; set; }
        public string html { get; set; }
        public Chapter[] chapters { get; set; }
        public MapSettings mapSettings { get; set; }
        public string[] layers { get; set; }
        public string baseLayer { get; set; }
    }

    public class Document
    {
        public Chapter[] chapters { get; set; } 
        public string map { get; set; }
    }    

    public class LayerSwitcherOptions
    {
        public List<LayerOptions> baselayers { get; set; }
        public List<GroupOptions> groups { get; set; }
    }

    public class LayerOptions
    {              
        public string id { get; set; }
        public bool? visibleAtStart { get; set; }
        public int? drawOrder { get; set; }
        public bool? visibleForGroups { get; set; }
        public string infobox { get; set; }
    }

    public class GroupOptions
    {
        public string id { get; set; }
        public string parent { get; set; }      
        public string name { get; set; }
        public bool? toggled { get; set; }
        public bool? expanded { get; set; }
        public List<LayerOptions> layers { get; set; }
        public List<GroupOptions> groups { get; set; }
    }

    public class DocumentCreator
    {
        private string documentFile = "oversiktsplan.json";

        private string cssFile = "oversiktsplan.css";

        private string layersFile = "layers.json";

        private string mapFile = "op.json";

        private LayerConfig layers;

        private MapConfig mapConfig;

        private LayerSwitcherOptions layerSwitcherOptions;

        /// <summary>
        /// Initialize the document creator.
        /// The layerlist is loaded from file.
        /// </summary>
        public DocumentCreator()
        {
            string file = String.Format("{0}App_Data\\{1}", HostingEnvironment.ApplicationPhysicalPath, this.layersFile);
            var layersJson = System.IO.File.ReadAllText(file);
            this.layers = JsonConvert.DeserializeObject<LayerConfig>(layersJson);

            string mapFile = String.Format("{0}App_Data\\{1}", HostingEnvironment.ApplicationPhysicalPath, this.mapFile);
            var mapJson = System.IO.File.ReadAllText(mapFile);
            this.mapConfig = JsonConvert.DeserializeObject<MapConfig>(mapJson);
            Tool t = this.mapConfig.tools.Find(tool => tool.type == "layerswitcher");
            if (t != null)
            {                
                this.layerSwitcherOptions = JsonConvert.DeserializeObject<LayerSwitcherOptions>(t.options.ToString());
            }                       
        }

        /// <summary>
        /// Convert the chapter from string to Object-representation.
        /// </summary>
        /// <param name="chapter"></param>
        /// <returns>Chapter object</returns>
        private Chapter ParseChapter(string chapter)
        {
            return JsonConvert.DeserializeObject<Chapter>(chapter);            
        }

        /// <summary>
        /// Loop the chapters and append the HTML-string for each chapter.
        /// </summary>
        /// <param name="chapters"></param>
        /// <param name="html"></param>
        private void appendHtml(List<Chapter> chapters, ref string html)
        {            
            foreach (Chapter chapter in chapters)
            {
                html += "<h1>" + chapter.header + "</h1>";
                html += chapter.html;
                html += this.appendMap(chapter);
                if (chapter.chapters.Length > 0)
                {
                    this.appendHtml(chapter.chapters.ToList(), ref html);
                };                
            }           
        }

        /// <summary>
        /// Loop the chapters and append a header for each chapter.
        /// </summary>
        /// <param name="chapters"></param>
        /// <param name="html"></param>
        /// <param name="pageContents"></param>
        private void appendHeader(List<Chapter> chapters, ref string html, Dictionary<int, string[]> pageContents)
        {            
            foreach (Chapter chapter in chapters)
            {                
                bool found = false;
                string foundPage = "";
                for (int i = 1; i < pageContents.Count + 1; i++)
                {
                    if (found)
                    {
                        break;
                    }
                    else
                    {
                        string[] pageLines = pageContents[i].ToArray();
                        for (int j = 0; j < pageContents[i].Count(); j++)
                        {
                            if (found)
                            {
                                break;
                            }
                            else
                            {                                                                           
                                if (pageLines[j] == chapter.header)
                                {
                                    found = true;
                                    foundPage = i.ToString();
                                }                                                                                                    
                            }
                        }
                    }
                }
                
                html += "<div style='clear:both'><div class='toc'><span style='float:left'>" + 
                    chapter.header + "</span><span style='float:right'>" +
                    foundPage + "</span></div></div>";

                if (chapter.chapters.Length > 0)
                {                    
                    this.appendHeader(chapter.chapters.ToList(), ref html, pageContents);
                };
            };
        }

        /// <summary>
        /// Create map and append the document with an image.
        /// </summary>
        /// <param name="chapter"></param>
        /// <returns>Path to created map image</returns>
        private string appendMap(Chapter chapter)
        {
            MapSettings mapSettings = chapter.mapSettings;
            chapter.baseLayer = "31";
            string[] layers = chapter.layers;
            if (layers != null && chapter.mapSettings.extent != null)
            {
                if (chapter.baseLayer != null) {
                    layers = (new string[] { chapter.baseLayer }).Union(chapter.layers).ToArray();
                }
                LayerConfig layerConfig = this.lookupLayers(layers);                
                MapExportItem mapExportItem = new MapExportItem();                
                int mapHeight = 500;
                int mapWidth = (int)(mapHeight * ((1 + Math.Sqrt(5)) / 2));
                mapExportItem.size = new int[] { mapWidth, mapHeight };
                mapExportItem.resolution = 150;
                double[] mapExtent = chapter.mapSettings.extent;                
                mapExportItem.bbox = new double[] { mapExtent[0], mapExtent[2], mapExtent[1], mapExtent[3] };

                mapExportItem.arcgisLayers = layerConfig.arcgislayers.Select(layer =>                     
                    layer.AsInfo(3007, layer.zIndex == null ? 0 : (int)layer.zIndex)
                ).ToList();

                mapExportItem.wmsLayers = layerConfig.wmslayers.Select(layer =>
                    layer.AsInfo(3007, layer.zIndex == null ? 0 : (int)layer.zIndex)
                ).ToList();

                mapExportItem.vectorLayers = layerConfig.vectorlayers.Select(layer =>
                    layer.AsInfo(3007, layer.zIndex == null ? 0 : (int)layer.zIndex)
                ).ToList();

                try
                {
                    System.Drawing.Image i = MapImageCreator.GetImage(mapExportItem);
                    string mapImageGuid = Guid.NewGuid().ToString();
                    string path = String.Format("C:\\tmp\\{0}.png", mapImageGuid);
                    i.Save(path, System.Drawing.Imaging.ImageFormat.Png);
                    (new Task(() =>
                    {
                        Thread.Sleep(5000);
                        File.Delete(path);
                    })).Start();
                    return string.Format("<div><img src='{0}'/></div>", path);
                }
                catch (Exception ex)
                {
                    return String.Empty;
                }                               
            }
            else
            {
                return String.Empty;
            }            
        }

        /// <summary>
        /// Lookup layer
        /// </summary>
        /// <param name="layer"></param>
        /// <param name="layers"></param>
        /// <returns>Mathing layers</returns>
        private bool layerLookup(ILayerConfig layer, string[] layers)
        {
            return layers.Any(layerId => layerId == layer.id);
        }

        /// <summary>
        /// Find layer in layerswitcher, recursively look through all groups.
        /// </summary>
        /// <param name="lookupLayer"></param>
        /// <param name="groups"></param>
        /// <returns>Found layer</returns>
        private LayerOptions findLayerInGroup(ILayerConfig lookupLayer, List<GroupOptions> groups)
        {            
            foreach (GroupOptions group in groups)
            {
                var found = findLayerInGroup(lookupLayer, group.groups);
                if (found != null)
                {
                    return found;
                }
                foreach (LayerOptions layer in group.layers)
                {
                    if (layer.id == lookupLayer.id)
                    {
                        return layer;
                    }                    
                }
            }
            return null;
        }

        /// <summary>
        /// Set the layer zIndex from the map config.
        /// </summary>
        /// <param name="layer"></param>
        private void setLayerZIndex(ILayerConfig layer)
        {
            LayerOptions foundLayer = this.layerSwitcherOptions.baselayers.ToList().Find(l => l.id == layer.id);
            if (foundLayer == null)
            {
                foundLayer = this.findLayerInGroup(layer, this.layerSwitcherOptions.groups);         
                if (foundLayer != null)
                {
                    layer.zIndex = foundLayer.drawOrder;
                }
            }
            else
            {
                layer.zIndex = foundLayer.drawOrder;
            }
        }

        /// <summary>
        /// Find layers in config with given ID.
        /// </summary>
        /// <param name="layers"></param>
        /// <returns>Mathing layers</returns>
        private LayerConfig lookupLayers(string[] layers)
        {
            List<ArcGISConfig> ArcGISLayers = this.layers.arcgislayers
                .Where(layer => this.layerLookup(layer, layers)).ToList();

            List<VectorConfig> VectorLayers = this.layers.vectorlayers
                .Where(layer => this.layerLookup(layer, layers)).ToList();

            List<WMSConfig> WMSLayers = this.layers.wmslayers
                .Where(layer => this.layerLookup(layer, layers)).ToList();

            List<WMTSConfig> WMTSLayers = this.layers.wmtslayers
                .Where(layer => this.layerLookup(layer, layers)).ToList();

            WMSLayers.ForEach(layer => { this.setLayerZIndex(layer); });

            return new LayerConfig()
            {
                arcgislayers = ArcGISLayers,
                vectorlayers = VectorLayers,
                wmslayers = WMSLayers,
                wmtslayers = WMTSLayers
            };
        }

        /// <summary>
        /// Create PDF-document
        /// </summary>
        /// <param name="folder"></param>
        /// <returns>Path to saved document</returns>
        public string Create(string folder)
        {
            string documentFile = String.Format("{0}App_Data\\documents\\{1}", HostingEnvironment.ApplicationPhysicalPath, this.documentFile);
            string documentJson = System.IO.File.ReadAllText(documentFile);

            var exportDocument = JsonConvert.DeserializeObject<Document>(documentJson);            
            string html = "";
            this.appendHtml(exportDocument.chapters.ToList(), ref html);
            var renderer = new HtmlToPdf();

            string cssFile = String.Format("{0}App_Data\\styles\\{1}", HostingEnvironment.ApplicationPhysicalPath, this.cssFile);
            renderer.PrintOptions.CustomCssUrl = new Uri(cssFile);

            // Build a footer using html to style the text
            // mergable fields are:
            // {page} {total-pages} {url} {date} {time} {html-title} & {pdf-title}
            renderer.PrintOptions.Footer = new HtmlHeaderFooter()
            {
                Height = 15,
                HtmlFragment = "<center>{page}</center>",
                DrawDividerLine = false
            };            

            var pdf2 = renderer.RenderHtmlAsPdf(html);            

            string path = "C:\\tmp\\temp_pdf_export.pdf";
            pdf2.SaveAs(path);

            string tocHtml = "";

            using (PdfReader reader = new PdfReader(path))
            {
                Dictionary<int, string[]> pageContents = new Dictionary<int, string[]>();
                for (int j = 1; j <= reader.NumberOfPages; j++)
                {
                    string text = PdfTextExtractor.GetTextFromPage(reader, j);
                    pageContents.Add(j, text.Split('\n'));
                }
                tocHtml = "<h1>Innehållsförteckning</h1>";                
                this.appendHeader(exportDocument.chapters.ToList(), ref tocHtml, pageContents);
            }

            File.Delete(path);

            var pdf1 = renderer.RenderHtmlAsPdf(tocHtml);

            var pdf = IronPdf.PdfDocument.Merge(pdf1, pdf2);

            var r = new Random();
            var i = r.Next();
            string fileName = "pdf-export-" + i + ".pdf";
            string localFile = HostingEnvironment.ApplicationPhysicalPath + "//Temp//" + fileName;
            pdf.SaveAs(localFile);
            return folder + fileName;                        
        }
    }
}