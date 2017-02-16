using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Drawing;
using MapService.Components.MapExport;
using PdfSharp.Pdf;
using PdfSharp.Drawing;
using System.Threading;
using System.Configuration;
using System.Web.Hosting;
using System.Drawing.Imaging;
using System.Threading.Tasks;
using System.Web.Mvc;

namespace MapService.Components
{
    public class PDFCreator
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
            using (MemoryStream ms = new MemoryStream())
            {
                img.Save(ms, ImageFormat.Jpeg);
                XImage image = XImage.FromStream(ms);
                double horizontal = (page.Width.Millimeter / 25.4) * 72 - (x * 2);
                double vertical = (page.Height.Millimeter / 25.4) * 72 - (y * 2);
                gfx.DrawImage(image, x, y, horizontal, vertical);
            }
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
        /// Convert stream to byte array.
        /// </summary>
        /// <param name="input"></param>
        /// <returns></returns>
        private static byte[] ReadFully(Stream input)
        {
            byte[] buffer = new byte[16 * 1024];
            using (MemoryStream ms = new MemoryStream())
            {
                int read;
                while ((read = input.Read(buffer, 0, buffer.Length)) > 0)
                {
                    ms.Write(buffer, 0, read);
                }
                return ms.ToArray();
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="img"></param>
        /// <param name="path"></param>
        /// <param name="exportItem"></param>
        /// <returns>byte[]</returns>
        private byte[] createPdf(Image img, MapExportItem exportItem)
        {            
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

            List<string> copyrights = new List<string>();
            if (ConfigurationManager.AppSettings["exportCopyrightText"] != null)
            {
                copyrights = ConfigurationManager.AppSettings["exportCopyrightText"].Split(',').ToList();
            }            

            string infoText = String.Empty;
            if (ConfigurationManager.AppSettings["exportInfoText"] != null)
            {
                infoText = ConfigurationManager.AppSettings["exportInfoText"];
            }

            int height = 45 + copyrights.Count * 10;

            XPoint[] points = new XPoint[]
            {
                new XPoint(12, 12),
                new XPoint(12, height),
                new XPoint(55 + displayLength, height),
                new XPoint(55 + displayLength, 12),
                new XPoint(12, 12)
            };

            gfx.DrawPolygon(XBrushes.White, points, XFillMode.Winding);

            this.drawText(gfx, String.Format("Skala 1:{0}", exportItem.scale), 15, 25);
            gfx.DrawLine(XPens.Black, new XPoint(15, 32), new XPoint(15 + displayLength, 32));
            gfx.DrawLine(XPens.Black, new XPoint(15, 28), new XPoint(15, 36));
            gfx.DrawLine(XPens.Black, new XPoint(15 + displayLength, 28), new XPoint(15 + displayLength, 36));
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

            byte[] bytes;

            using (MemoryStream ms = new MemoryStream()) {
                document.Save(ms);
                bytes = ReadFully(ms);    
            }            

            return bytes;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="dataSet"></param>
        /// <returns></returns>
        public byte[] Create(MapExportItem exportItem)
        {
            return this.createPdf(MapImageCreator.GetImage(exportItem), exportItem);            
        }            
    }
}