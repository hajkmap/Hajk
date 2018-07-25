using System;
using System.CodeDom;
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
using PdfSharp;

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
        private void drawText(XGraphics gfx, string fontName, string text, int x, int y, int height = 10)
        {
            XColor color = XColors.Black;
            XFont font = new XFont(fontName, height);
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
        private byte[] createPdf(Image img, MapExportItem exportItem, string fontName)
        {
            PdfDocument document = new PdfDocument();
            PdfPage page = document.AddPage();

            page.Size = GetPageSize(exportItem);
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

            int displayLength = GetDisplayLength(unitLength, scaleBarLengths, scale);
            string displayText = GetDisplayText(unitLength, scaleBarTexts, scale);

            // adding support for different layouts
            int layout = ConfigurationManager.AppSettings["exportLayout"] != null ? int.Parse(ConfigurationManager.AppSettings["exportLayout"]) : 1;
            if (layout == 1)//original layout
            {
                //origina code from github

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

                this.drawText(gfx, fontName, String.Format("Skala 1:{0}", exportItem.scale), 15, 25);
                gfx.DrawLine(XPens.Black, new XPoint(15, 32), new XPoint(15 + displayLength, 32));
                gfx.DrawLine(XPens.Black, new XPoint(15, 28), new XPoint(15, 36));
                gfx.DrawLine(XPens.Black, new XPoint(15 + displayLength, 28), new XPoint(15 + displayLength, 36));
                this.drawText(gfx, fontName, displayText, 20 + displayLength, 35);

                var y = (int)page.Height.Point - 15;

                this.drawText(gfx, fontName, infoText, 15, y);

                int i = 0;
                copyrights.ForEach(copyright =>
                {
                    int start = 50;
                    this.drawText(gfx, fontName, String.Format("© {0}", copyright), 15, start + i * 10);
                    i++;
                });

                XImage logo = XImage.FromFile(Path.Combine(HostingEnvironment.ApplicationPhysicalPath, "assets", "logo.png"));
                gfx.DrawImage(logo, (gfx.PageSize.Width - logo.PixelWidth / 2) - 12, 12, logo.PixelWidth / 2, logo.PixelHeight / 2);

                byte[] bytes;

                using (MemoryStream ms = new MemoryStream())
                {
                    document.Save(ms);
                    bytes = ReadFully(ms);
                }

                return bytes;
            }
            else if (layout == 2)//new layout
            {
                // x and y 0 0(top left corner?)-> change
                this.drawImage(gfx, img, 33, 33, page);

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

                int height = 1;

                XPoint[] points = new XPoint[]
                {
                new XPoint(12, 12),
                new XPoint(12, height),
                new XPoint(55 + displayLength, height),
                new XPoint(55 + displayLength, 12),
                new XPoint(12, 12)
                };

                gfx.DrawPolygon(XBrushes.White, points, XFillMode.Winding);
                // x y
                this.drawText(gfx, fontName, String.Format("Skala 1:{0}", exportItem.scale), 33, (int)page.Height.Point - 23, 8);
                gfx.DrawLine(XPens.Black, new XPoint(33, (int)page.Height.Point - 18), new XPoint(33 + displayLength, (int)page.Height.Point - 18));
                gfx.DrawLine(XPens.Black, new XPoint(33, (int)page.Height.Point - 15), new XPoint(33, (int)page.Height.Point - 21));
                gfx.DrawLine(XPens.Black, new XPoint(33 + displayLength / 2, (int)page.Height.Point - 17), new XPoint(33 + displayLength / 2, (int)page.Height.Point - 19));
                gfx.DrawLine(XPens.Black, new XPoint(33 + displayLength, (int)page.Height.Point - 15), new XPoint(33 + displayLength, (int)page.Height.Point - 21));
                this.drawText(gfx, fontName, displayText, 38 + displayLength, (int)page.Height.Point - 16, 8);
                
                var y = (int)page.Height.Point - 2;

                this.drawText(gfx, fontName, infoText, 33, y, 8);

                int i = 0;
                copyrights.ForEach(copyright =>
                {
                    int start = (int)page.Height.Point - 15;
                    this.drawText(gfx, fontName, String.Format("© {0}", copyright), (int)page.Width.Point - 100, start + i * 10, 8);
                    i++;
                });

                XImage logo = XImage.FromFile(Path.Combine(HostingEnvironment.ApplicationPhysicalPath, "assets", "logo.png"));
                gfx.DrawImage(logo, (gfx.PageSize.Width - logo.PixelWidth / 5) - 33, 3.5, logo.PixelWidth / 5, logo.PixelHeight / 5);

                byte[] bytes;

                using (MemoryStream ms = new MemoryStream())
                {
                    document.Save(ms);
                    bytes = ReadFully(ms);
                }

                return bytes;
            }

            return null;
        }

        private int GetDisplayLength(double unitLength, Dictionary<int, int> scaleBarLengths, int scale)
        {
            int scaleBarLength = 0;
            if (scaleBarLengths.TryGetValue(scale, out scaleBarLength))
            {
                return (int) (unitLength * scaleBarLength);
            }
            if (scale <= 500)
            {
                return (int) (unitLength * (scale / 10));
            }
            return (int)(unitLength * (scale * 0.05)); 

        }

        private string GetDisplayText(double unitLength, Dictionary<int, string> scaleBarTexts, int scale)
        {
            string scaleBarText = "";
            if (scaleBarTexts.TryGetValue(scale, out scaleBarText))
            {
                return scaleBarText;
            }
            if (scale <= 500) {
                return (scale / 10) + " m";
            }
            if (scale < 25000)
            {
                return Math.Ceiling(scale * 0.05) + " m";
            }
            return Math.Ceiling(scale * 0.05 / 1000) + " km";
        }
          
        private PageSize GetPageSize(MapExportItem exportItem)
        {
            PageSize p;
            if (Enum.TryParse(exportItem.format, true, out p))
            {
                return p;
            }
            throw new ApplicationException("Unknown page size");
        }

        public byte[] Create(MapExportItem exportItem, string fontName)
        {
            return this.createPdf(MapImageCreator.GetImage(exportItem), exportItem, fontName);
        }
    }
}
