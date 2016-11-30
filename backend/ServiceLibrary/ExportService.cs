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
using System.Configuration;
using System.Threading;
using System.Threading.Tasks;

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

        [OperationContract]
        string ImportImage(Stream Uploading);
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
        [WebInvoke(Method = "POST", ResponseFormat = WebMessageFormat.Xml, BodyStyle = WebMessageBodyStyle.Bare, UriTemplate = "/importimage")]
        public string ImportImage(Stream stream)
        {
            string tempPath = "/Upload";
            string path = HttpContext.Current.Server.MapPath(tempPath);
            string filename = Guid.NewGuid() + ".png";
            string localPng = path + "\\" + filename;
            
            MultipartParser parser = new MultipartParser(stream);
            using (var ms = new MemoryStream(parser.FileContents))
            {
                Image img = Image.FromStream(ms);                            
                img.Save(localPng, ImageFormat.Png);
            }

            return tempPath + "/" + filename;
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
            string tempPath = "/Temp";

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
            return tempPath + '/' + fileinfo[1];
        }

        AutoResetEvent stopWaitHandle = new AutoResetEvent(false);

        private string createPdf(Image img, string path, MapExportItem exportItem)
        {            
            string filename = Guid.NewGuid() + ".pdf";
            string localPdf = path + "\\" + filename;

            PdfDocument document = new PdfDocument();
            PdfPage page = document.AddPage();
            
            page.Size = exportItem.format == "A4" ? PdfSharp.PageSize.A4 : PdfSharp.PageSize.A3;
            page.Orientation = exportItem.orientation == "L" ? PdfSharp.PageOrientation.Landscape : PdfSharp.PageOrientation.Portrait;

            XGraphics gfx = XGraphics.FromPdfPage(page);

            int scale = int.Parse(exportItem.scale);
            double length = (1.0 / scale);
            double unitLength = (length * 2.82e3);

            Dictionary<int, string> scaleBarTexts = new Dictionary<int, string>()
                    {
                        {250, "25 m"},
                        {500, "50 m"},
                        {1000, "50 m"},
                        {2500, "100 m"},
                        {5000, "200 m"},
                        {10000, "500 m"},
                        {25000, "1 km"},
                        {50000, "2 km"},
                        {100000, "5 km"},
                        {250000, "10 km"}
                    };

            Dictionary<int, int> scaleBarLengths = new Dictionary<int, int>()
                    {
                        {250, 25},
                        {500, 50},
                        {1000, 50},
                        {2500, 100},
                        {5000, 200},
                        {10000, 500},
                        {25000, 1000},
                        {50000, 2000},
                        {100000, 5000},
                        {250000, 10000}
                    };

            int displayLength = (int)(unitLength * scaleBarLengths.FirstOrDefault(a => a.Key == scale).Value);
            string displayText = scaleBarTexts.FirstOrDefault(a => a.Key == scale).Value;
                        
            this.drawImage(gfx, img, 0, 0, page);
            List<string> copyrights = ConfigurationManager.AppSettings["exportCopyrightText"].Split(',').ToList();
            string infoText = String.Empty;
            if (ConfigurationManager.AppSettings["exportInfoText"] != null)
            {
                infoText = ConfigurationManager.AppSettings["exportInfoText"];
            }            

            int height = 45 + copyrights.Count * 10;

            Point[] points = new Point[]
            {                
                new Point(12, 12),
                new Point(12, height),
                new Point(55 + displayLength, height),
                new Point(55 + displayLength, 12),
                new Point(12, 12)
            };

            gfx.DrawPolygon(XBrushes.White, points, XFillMode.Winding);

            this.drawText(gfx, String.Format("Skala 1:{0}", exportItem.scale), 15, 25);
            gfx.DrawLine(XPens.Black, new Point(15, 32), new Point(15 + displayLength, 32));
            gfx.DrawLine(XPens.Black, new Point(15, 28), new Point(15, 36));
            gfx.DrawLine(XPens.Black, new Point(15 + displayLength, 28), new Point(15 + displayLength, 36));
            this.drawText(gfx, displayText, 20 + displayLength, 35);            

            var y = (int)page.Height.Point - 15;

            this.drawText(gfx, infoText, 15, y);

            int i = 0;
            copyrights.ForEach(copyright =>
            {
                int start = 50;
                this.drawText(gfx, String.Format("© {0}", copyright), 15, start + i * 10);
                i++;
            });

            XImage logo = XImage.FromFile(Path.Combine(HostingEnvironment.ApplicationPhysicalPath, "assets", "logo.png"));
            gfx.DrawImage(logo, (gfx.PageSize.Width - logo.PixelWidth / 2) - 12, 12, logo.PixelWidth / 2, logo.PixelHeight / 2);

            document.Save(localPdf);
            return filename;
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
            string filePath = "";
            if (exportItem.wmtsLayers == null || exportItem.wmtsLayers.Count == 0)
            {
                Image img = MapImageCreator.GetImage(exportItem);
                filePath = tempPath + "/" + this.createPdf(img, path, exportItem);                
            }
            else
            {
                MapImageCreator.GetImageAsync(exportItem, (data) =>
                {
                    Image img = (Image)data.image.Clone();
                    try
                    {
                        filePath = tempPath + "/" + this.createPdf(img, path, exportItem);
                    }
                    catch (Exception ex)
                    {
                        filePath = ex.Message;
                    }
                    finally {
                        stopWaitHandle.Set();
                    }                    
                });
                stopWaitHandle.WaitOne();
            }            
            return filePath;
        }
    }
}
