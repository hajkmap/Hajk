using System;
using System.Linq;
using System.ServiceModel;
using System.ServiceModel.Activation;
using System.ServiceModel.Web;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Web;
using System.Web.Mvc;
using PdfSharp.Pdf;
using PdfSharp.Drawing;
using log4net;
using System.Text;
using System.Xml;
using System.Net.Http;
using Sweco.Services.HTTP;
using System.Web.Hosting;
using Sweco.Services.MapExport;
using PdfSharp.Drawing.Layout;

namespace Sweco.Services
{
    [ServiceContract]
    public interface IExportService
    {        
        [OperationContract]
        string ExportPDF(MapExportItem exportItem);

        [OperationContract]
        string ExportKML();

        [OperationContract]
        string ImportKML(Stream Uploading);
    }

    [ServiceBehavior(InstanceContextMode = InstanceContextMode.PerCall, ConcurrencyMode = ConcurrencyMode.Multiple, IgnoreExtensionDataObject = true)]
    [AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Allowed)]
    public sealed class ExportService : IExportService    
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="gfx"></param>
        /// <param name="jpegSamplePath"></param>
        /// <param name="x"></param>
        /// <param name="y"></param>
        private void drawImage(XGraphics gfx, Image img, double x, double y, PdfPage page)
        {
            XImage image = XImage.FromGdiPlusImage(img);                 
            
            double horizontal = (page.Width.Millimeter / 25.4) * 72 - (x * 2);
            double vertical = (page.Height.Millimeter / 25.4) * 72 - (y * 2);

            gfx.DrawImage(image, x, y, horizontal, vertical);                                 
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="gfx"></param>
        /// <param name="text"></param>
        /// <param name="x"></param>
        /// <param name="y"></param>
        private void drawText(XGraphics gfx, string text, int x, int y)
        {
            XColor color = XColors.Black;
            XFont font = new XFont("Verdana", 10);
            XBrush brush = new XSolidBrush(color);            
            gfx.DrawString(text, font, brush, x, y);
        }

        /// <summary>
        /// Create filename with unique timestamp and guid.
        /// </summary>
        /// <param name="name"></param>
        /// <param name="extension"></param>
        /// <returns>Array<string></returns>
        private string[] generateFileInfo(string name, string extension, string folder = "/Temp")
        {
            string path = HttpContext.Current.Server.MapPath(folder);
            string timestamp = DateTime.Now.ToString("yyyy-MM-dd-HH-mm-ss");
            string guid = Guid.NewGuid().ToString().Substring(0, 3);
            string filename = String.Format("{0}-{1}_{2}.{3}", name, timestamp, guid, extension);
            string filepath = path + "\\" + filename;
            return new string[] { filepath, filename };
        }
        
        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        [WebInvoke(Method = "POST", ResponseFormat = WebMessageFormat.Xml, BodyStyle = WebMessageBodyStyle.Bare, UriTemplate = "/importkml")]
        public string ImportKML(Stream stream)
        {
            MultipartParser parser = new MultipartParser(stream);
            XmlDocument doc = new XmlDocument();
            var filename = parser.Filename;
            string fileContent = System.Text.Encoding.UTF8.GetString(parser.FileContents);
            return fileContent;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        [WebInvoke(Method = "POST", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/kml")]
        public string ExportKML()
        {
            string source = String.Empty;
            string type = String.Empty;
            string body = String.Empty;

            using (var stream = OperationContext.Current.RequestContext.RequestMessage.GetBody<Stream>())
            {
                StreamReader reader = new StreamReader(stream);
                body = reader.ReadToEnd();                
            }

            string[] fileinfo = this.generateFileInfo("kartexport", "kml");
            XmlDocument doc = new XmlDocument();
            MemoryStream ms = new MemoryStream();
            doc.LoadXml(body);
            doc.Save(ms);
            System.IO.File.WriteAllBytes(fileinfo[0], ms.ToArray());
            return HttpContext.Current.Request.Url.GetLeftPart(UriPartial.Authority) + "/Temp/" + fileinfo[1];
        }

        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        [WebInvoke(Method = "POST", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/pdf")]
        public string ExportPDF(MapExportItem exportItem)
        {
            string tempPath = "/Temp";            
            string path = HttpContext.Current.Server.MapPath(tempPath);
            string filename = Guid.NewGuid() + ".pdf";
            string localPdf = path + "\\" + filename;
            
            Image img = MapImageCreator.GetImage(exportItem);            
            PdfDocument document = new PdfDocument();
            PdfPage page = document.AddPage();

            page.Size = exportItem.format == "A4" ? PdfSharp.PageSize.A4 : PdfSharp.PageSize.A3;
            page.Orientation = exportItem.orientation == "L" ? PdfSharp.PageOrientation.Landscape : PdfSharp.PageOrientation.Portrait;
     
            XGraphics gfx = XGraphics.FromPdfPage(page);            
                                   
            int scale = int.Parse(exportItem.scale);
            double length = (1.0 / scale);
            double unitLength = (length * 2.75e3);         

            Dictionary<int, string> scaleBarTexts = new Dictionary<int, string>() 
            {
                {1000, "50 m"},
                {2000, "100 m"},
                {5000, "200 m"},
                {10000, "500 m"},
                {20000, "1 km"},
                {50000, "2 km"},
                {100000, "5 km"},
                {250000, "10 km"}
            };

            Dictionary<int, int> scaleBarLengths = new Dictionary<int,int>() 
            {
                {1000, 50},
                {2000, 100},
                {5000, 200},
                {10000, 500},
                {20000, 1000},
                {50000, 2000},
                {100000, 5000},
                {250000, 10000}
            };
            
            int displayLength = (int)(unitLength * scaleBarLengths.FirstOrDefault(a => a.Key == scale).Value);
            string displayText = scaleBarTexts.FirstOrDefault(a => a.Key == scale).Value;

            this.drawImage(gfx, img, 10, 10, page);

            Point[] points = new Point[] {                
                new Point(12, 12),
                new Point(12, 55),
                new Point(55 + displayLength, 55),
                new Point(55 + displayLength, 12),
                new Point(12, 12) 
            };

            gfx.DrawPolygon(XBrushes.White, points, XFillMode.Winding);

            gfx.DrawLine(XPens.Black, new Point(15, 47), new Point(15 + displayLength, 47));
            gfx.DrawLine(XPens.Black, new Point(15, 44), new Point(15, 50));
            gfx.DrawLine(XPens.Black, new Point(15 + displayLength, 44), new Point(15 + displayLength, 50));
            
            this.drawText(gfx, String.Format("© Stadsbyggnadskontoret", exportItem.scale), 15, 25);
            this.drawText(gfx, String.Format("Skala 1:{0}", exportItem.scale), 15, 40);            
            this.drawText(gfx, displayText, 20 + displayLength, 50);            

            XImage logo = XImage.FromFile(Path.Combine(HostingEnvironment.ApplicationPhysicalPath, "assets", "logo.png"));           
            gfx.DrawImage(logo, gfx.PageSize.Width - 212, 12, 200, 67);

            document.Save(localPdf);

            return HttpContext.Current.Request.Url.GetLeftPart(UriPartial.Authority) + tempPath + "/" + filename;
        }                 
    }
}
