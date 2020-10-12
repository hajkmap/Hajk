using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Hosting;
using System.IO;
using System.Net.Http;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using MapService.Models.Config;
using MapService.Components.MapExport;
using MapService.Models;
using System.Threading.Tasks;
using System.Threading;
using System.Security.AccessControl;
using Common.Logging;

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
        public string img_link { get; set; }
        public string img_width { get; set; }
        public string img_height { get; set; }
        public Chapter[] chapters { get; set; }
        public MapSettings mapSettings { get; set; }
        public string[] layers { get; set; }
        public string baseLayer { get; set; }
        public int startPage { get; set; }
        public int number_page { get; set; }
        public int stopPage { get; set; }
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

        private int renderedChapters = 0;

        private int totalChapters;

        private string baseLayer = "";

        private List<int> printPages;

        private LayerConfig layers;

        private MapConfig mapConfig;

        private LayerSwitcherOptions layerSwitcherOptions;
        /// <summary>
        /// Initialize the document creator.
        /// The layerlist is loaded from file.
        /// </summary>
        public DocumentCreator()
        {           
        }

        /// <summary>
        /// Count total number of chapters
        /// </summary>
        /// <param name="chapters"></param>
        /// <param name="numChapters"></param>
        /// <returns></returns>
        private int GetTotalChapters(List<Chapter> chapters, int numChapters)
        {
            numChapters += chapters.Count;
            foreach(Chapter chapter in chapters)
            {
                return GetTotalChapters(chapter.chapters.ToList(), numChapters);
            }
            return numChapters;
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
        private void AppendHtml(List<Chapter> chapters, ref StringBuilder html)
        {   
            
            foreach (Chapter chapter in chapters)
            {
                renderedChapters += 1;
                html.Append("<h1>" + chapter.header + "</h1>");            
                html.Append(chapter.html);
                html.Append(this.AppendMap(chapter));
                //html.Append("<div> <img style='width:"+chapter.img_width+ ";height=" + chapter.img_height + "' src='" + chapter.img_link+ "'></div>");
                html.Append("<div style='page-break-after: always;'></div>");

                if (chapter.chapters.Length > 0)
                {
                    this.AppendHtml(chapter.chapters.ToList(), ref html);
                };
                //if (renderedChapters < totalChapters)
                //{                
                //}
            }           
        }

        /// <summary>
        /// Loop the chapters and append a header for each chapter.
        /// </summary>
        /// <param name="chapters"></param>
        /// <param name="html"></param>
        /// <param name="pageContents"></param>
        private void AppendHeader(List<Chapter> chapters, ref string html, Dictionary<int, string[]> pageContents)
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
                                if (chapter.header.TrimEnd() == pageLines[j])
                                    {
                                    found = true;
                                        foundPage = i.ToString();
                                        chapter.startPage = i;
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
                    this.AppendHeader(chapter.chapters.ToList(), ref html, pageContents);
                };
            };
        }

        private string AppendMap(Chapter chapter)
        {
                return string.Format("<div><img style='width:"+chapter.img_width+ ";height=" + chapter.img_height + "' src='" + chapter.img_link+ "'></div>");
        }

        private bool LayerLookup(ILayerConfig layer, string[] layers)
        {
            return layers.Any(layerId => layerId == layer.id);
        }

       
        private LayerOptions FindLayerInGroup(ILayerConfig lookupLayer, List<GroupOptions> groups)
        {            
            foreach (GroupOptions group in groups)
            {
                var found = this.FindLayerInGroup(lookupLayer, group.groups);
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

       
        private void SetLayerZIndex(ILayerConfig layer)
        {
            LayerOptions foundLayer = this.layerSwitcherOptions.baselayers.ToList().Find(l => l.id == layer.id);
            if (foundLayer == null)
            {
                foundLayer = this.FindLayerInGroup(layer, this.layerSwitcherOptions.groups);         
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

        private LayerConfig LookupLayers(string[] layers)
        {
            List<ArcGISConfig> ArcGISLayers = this.layers.arcgislayers
                .Where(layer => this.LayerLookup(layer, layers)).ToList();

            List<VectorConfig> VectorLayers = this.layers.vectorlayers
                .Where(layer => this.LayerLookup(layer, layers)).ToList();

            List<WMSConfig> WMSLayers = this.layers.wmslayers
                .Where(layer => this.LayerLookup(layer, layers)).ToList();

            List<WMTSConfig> WMTSLayers = this.layers.wmtslayers
                .Where(layer => this.LayerLookup(layer, layers)).ToList();

            WMSLayers.ForEach(layer => { this.SetLayerZIndex(layer); });
            VectorLayers.ForEach(layer => { this.SetLayerZIndex(layer); });
            ArcGISLayers.ForEach(layer => { this.SetLayerZIndex(layer); });

            return new LayerConfig()
            {
                arcgislayers = ArcGISLayers,
                vectorlayers = VectorLayers,
                wmslayers = WMSLayers,
                wmtslayers = WMTSLayers
            };
        }

        private void FlattenChapters(Chapter[] chapters, ref List<Chapter> flattened)
        {
            foreach (Chapter chapter in chapters)
            {
                {
                    flattened.Add(new Chapter()
                    {
                        header = chapter.header,
                        html = chapter.html,
                        startPage = chapter.startPage
                    });
                    if (chapter.chapters.Length > 0)
                    {
                        FlattenChapters(chapter.chapters, ref flattened);
                    }
                }
            }
        }

        private Chapter LastChapter(Chapter chapter)
        {
            if (chapter.chapters.Length > 0)
            {
                return LastChapter(chapter.chapters[chapter.chapters.Length - 1]);
            }
            else
            {
                return chapter;
            }
        }

        private void RemoveLastPage(PdfSharp.Pdf.PdfDocument document)
        {
            document.Pages.RemoveAt(document.Pages.Count - 1);
        }

        private void RemoveSurroundingPages(string header, string html, Chapter[] chapters, PdfSharp.Pdf.PdfDocument document)
        {
            for (int i = 0; i < chapters.Count(); i++)
            {
                if (chapters[i].header == header)
                {
                    int startPage = chapters[i].startPage;
                    int stopPage = document.PageCount;

                    if (i < chapters.Count() - 1)
                    {
                        stopPage = chapters[i + 1].startPage;
                    }
                    else
                    {
                        if (chapters[i].chapters.Length > 0)
                        {
                            Chapter lastChapter = this.LastChapter(chapters[i]);
                            stopPage = lastChapter.stopPage;
                        }
                        else
                        {
                            if (chapters[i].stopPage > 0)
                            {
                                stopPage = chapters[i].stopPage;
                            }
                        }
                    }
                    if (stopPage == 0)
                    {
                        stopPage = document.PageCount;
                    }

                    int startIndex = 0;
                    int stopIndex = document.PageCount;
                    int chapterStartIndex = startPage - 1;
                    int chapterEndIndex = stopPage - 1;

                    if (chapterEndIndex < stopIndex) {     
                        for (int t = chapterEndIndex; t < stopIndex; t++)
                        {
                            document.Pages.RemoveAt(chapterEndIndex);
                        }
                    }

                    if (chapterStartIndex > startIndex) {                                                
                        for (int j = startIndex; j < chapterStartIndex; j++)
                        {
                            document.Pages.RemoveAt(0);
                        }
                    }

                    break;
                }
                if (chapters[i].chapters.Length > 0)
                {
                    RemoveSurroundingPages(header, html, chapters[i].chapters, document);
                }
            }
        }

        private void SetChapterPages(Chapter[] chapters, List<Chapter> flattened, ref int counter)
        {
            foreach(Chapter chapter in chapters)
            {
                counter += 1;
                if (counter < flattened.Count)
                {
                    chapter.stopPage = flattened[counter].startPage;
                }
                else
                {
                    chapter.stopPage = chapters.ToList().Last().stopPage;
                }
                if (chapter.chapters.Length > 0)
                {
                    SetChapterPages(chapter.chapters, flattened, ref counter);
                }
            }
        }

        public string Create(string folder, InformativeExport informativeExport)
        {
            this.documentFile = informativeExport.documentFile;
            this.mapFile = informativeExport.mapFile;
            this.baseLayer = informativeExport.baseMapId;

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

            // Some operations will use the tmp-folder. Created files are deleted when used.
            Directory.CreateDirectory("C:\\tmp");
            
            // Load informative document
            string documentFile = String.Format("{0}App_Data\\documents\\{1}", HostingEnvironment.ApplicationPhysicalPath, this.documentFile);            
            string documentJson = System.IO.File.ReadAllText(documentFile);            
            var exportDocument = JsonConvert.DeserializeObject<Document>(documentJson);

            StringBuilder html = new StringBuilder();
            String.Format("{0}App_Data\\documents\\{1}", HostingEnvironment.ApplicationPhysicalPath, this.documentFile);

            html.AppendLine("<head>");
            html.AppendLine("<meta charset='UTF-8'>");
            html.AppendLine("<head><style>ul {list-style:none;padding:0;margin:0;}li {padding-left: 16px;}li::before {content: ' - ';padding-right: 8px;color: blue;}</style></head>");
            html.AppendLine("<body>");
            html.AppendLine("<style>");            
            html.AppendLine("body { font-family: arial; font-size: 13pt !important;}");
            html.AppendLine("body img { width: 100%; }");
            html.AppendLine("</style>");

            // Append maps to document
            this.totalChapters = GetTotalChapters(exportDocument.chapters.ToList(), 0);
            this.AppendHtml(exportDocument.chapters.ToList(), ref html);
            html.AppendLine("</body>");

            var htmlToPdf = new NReco.PdfGenerator.HtmlToPdfConverter();

            htmlToPdf.Margins.Bottom = 15;
            htmlToPdf.Margins.Top = 15;

            htmlToPdf.PageFooterHtml = "<div style='text-align:center;'><span class='page'></span> </div>";
            var pdfBytes1 = htmlToPdf.GeneratePdf(html.ToString());
            
            //
            // Read the created document and match headers to create toc.
            // Headers must be unique
            //            
            string tocHtml = "";
            iTextSharp.text.pdf.PdfReader reader = new iTextSharp.text.pdf.PdfReader(pdfBytes1);
            
            Dictionary<int, string[]> pageContents = new Dictionary<int, string[]>();
            for (int j = 1; j <= reader.NumberOfPages; j++)
            {
                string text = iTextSharp.text.pdf.parser.PdfTextExtractor.GetTextFromPage(reader, j);               
                pageContents.Add(j, text.Split('\n'));
            }
            tocHtml += "<head>";
            tocHtml += "<meta charset='UTF-8'>";
            tocHtml += "<head><style>ul {list-style:none;padding:0;margin:0;}li {padding-left: 16px;}li::before {content: ' - ';padding-right: 8px;color: blue;}</style></head>";
            tocHtml += "<body>";
            tocHtml += "<style>";
            tocHtml += "body { font-family: arial; font-size: 13pt !important;}";
            tocHtml += "body img { width: 100%; }";
            tocHtml += "</style>";                                
            tocHtml += "<h1>Innehållsförteckning</h1>";

            this.AppendHeader(exportDocument.chapters.ToList(), ref tocHtml, pageContents);
            tocHtml += "</body>";

            htmlToPdf.PageFooterHtml = "";
            var pdfBytes2 = htmlToPdf.GeneratePdf(tocHtml.ToString());
           

            MemoryStream stream1 = new MemoryStream(pdfBytes1);
            MemoryStream stream2 = new MemoryStream(pdfBytes2);

            PdfSharp.Pdf.PdfDocument inputDocument1 = PdfSharp.Pdf.IO.PdfReader.Open(stream1, PdfSharp.Pdf.IO.PdfDocumentOpenMode.Import);
            PdfSharp.Pdf.PdfDocument inputDocument2 = PdfSharp.Pdf.IO.PdfReader.Open(stream2, PdfSharp.Pdf.IO.PdfDocumentOpenMode.Import);
            PdfSharp.Pdf.PdfDocument outputDocument = new PdfSharp.Pdf.PdfDocument();

            List<PdfSharp.Pdf.PdfDocument> inputDocuments = new List<PdfSharp.Pdf.PdfDocument>();

            inputDocuments.Add(inputDocument2);
            inputDocuments.Add(inputDocument1);                
           
            //
            // Remove unwanted pages.
            // Pages within the same chapter will remain.            
            //
            List<Chapter> flattened = new List<Chapter>();
            FlattenChapters(exportDocument.chapters, ref flattened);
            int chapterCount = 0;
            this.SetChapterPages(exportDocument.chapters, flattened, ref chapterCount);
            int initialPageCount = inputDocument1.Pages.Count;
            this.RemoveSurroundingPages(informativeExport.chapterHeader, informativeExport.chapterHtml, exportDocument.chapters, inputDocument1);
            int modifiedPageCount = inputDocument1.Pages.Count;

            if (initialPageCount == modifiedPageCount) {
                this.RemoveLastPage(inputDocument1);
            }

            inputDocuments.ForEach(document =>
            {
                int count = document.PageCount;
                for (int idx = 0; idx < count; idx++)
                {
                    PdfSharp.Pdf.PdfPage page = document.Pages[idx];
                    outputDocument.AddPage(page);
                }
            });

            reader.Close();
            stream1.Close();
            stream2.Close();

            var r = new Random();
            var i = r.Next();
            string fileName = "pdf-export-" + i + ".pdf";
            string localFile = HostingEnvironment.ApplicationPhysicalPath + "//Temp//" + fileName;            
            outputDocument.Save(localFile);            

            return fileName;            
        }
    }
}