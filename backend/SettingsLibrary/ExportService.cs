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

namespace Sweco.Services
{
    [ServiceContract]
    public interface IExportService
    {
        [OperationContract]
        string Export();

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
        private void drawImage(XGraphics gfx, string jpegSamplePath, int x, int y)
        {
            XImage image = XImage.FromFile(jpegSamplePath);            
            double width = image.PixelWidth;
            double height = image.PixelHeight;            
            gfx.DrawImage(image, x, y, width, height);
            
            XImage logo = XImage.FromFile(Path.Combine(HostingEnvironment.ApplicationPhysicalPath, "App_Data", "logo.png"));           
            gfx.DrawImage(logo, gfx.PageSize.Width - 60, 10);
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
        [WebInvoke(Method="POST", ResponseFormat = WebMessageFormat.Json, UriTemplate = "/")]
        public string Export()
        {            
            string source = String.Empty;
            string type = String.Empty;
            string body = String.Empty;
            string format = "A4";
            PdfSharp.PageSize pageSize = PdfSharp.PageSize.A4;
            PdfSharp.PageOrientation orientation = PdfSharp.PageOrientation.Landscape;
            string orient = "L";
            int x = 0;
            int y = 0;
                        
            using (var stream = OperationContext.Current.RequestContext.RequestMessage.GetBody<Stream>())            
            {                
                StreamReader reader = new StreamReader(stream);
                body = reader.ReadToEnd();
                string[] content = body.Split(';');
                type = content[0];
                if (type == "pdf")
                {
                    x = int.Parse(content[1]);
                    y = int.Parse(content[2]);
                    format = content[3];
                    orient = content[4];          
                    source = content[5];
                    switch (orient)
                    {
                        case ("L"):
                            orientation = PdfSharp.PageOrientation.Landscape;
                            break;
                        case ("P"):
                            orientation = PdfSharp.PageOrientation.Portrait;
                            break;
                    }
                    switch (format)
                    {
                        case ("A4"):
                            pageSize = PdfSharp.PageSize.A4;
                            break;
                        case ("A3"):
                            pageSize = PdfSharp.PageSize.A3;
                            break;
                    }
                }
                else
                {
                    source = content[1];
                }
                
            }            
            
            byte[] image = Convert.FromBase64String(HttpContext.Current.Server.UrlDecode(source));
            
            string folder = "/Temp/";
            string path = HttpContext.Current.Server.MapPath(folder);
            string filename = "";
            
            filename = Guid.NewGuid() + ".png";                
            string local = path + filename;            

            MemoryStream ms = new MemoryStream(image);
            Image img = Image.FromStream(ms);            
            
            img.Save(local, ImageFormat.Png);

            if (type == "pdf")
            {
                filename = Guid.NewGuid() + ".pdf";
                string localPdf = path + filename;

                PdfDocument document = new PdfDocument();                
                PdfPage page = document.AddPage();
                
                page.Size = pageSize;
                page.Orientation = orientation;
                
                x = -x;
                y = -y;

                XGraphics gfx = XGraphics.FromPdfPage(page);
                this.drawImage(gfx, local, x, y);
                this.drawText(gfx, "© Lantmäteriverket i2009/00858", 10, 25);

                document.Save(localPdf);
            }
            return HttpContext.Current.Request.Url.GetLeftPart(UriPartial.Authority) + folder + filename;
        }        
    }
}
