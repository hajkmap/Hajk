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
using Newtonsoft.Json;
using log4net;

namespace MapService.Components
{
    public class PDFCreator
    {
        ILog _log = LogManager.GetLogger(typeof(PDFCreator));
        /// <summary>
        /// 
        /// </summary>
        /// <param name="gfx"></param>
        /// <param name="jpegSamplePath"></param>
        /// <param name="x"></param>
        /// <param name="y"></param>
        private void drawImage(XGraphics gfx, Image img, double x, double y, PdfPage page, int layout)
        {
            using (MemoryStream ms = new MemoryStream())
            {
                img.Save(ms, ImageFormat.Jpeg);
                XImage image = XImage.FromStream(ms);
                if (layout == 3)
                {

                    double oneCM = page.Height.Point * 0.02;
                    double horizontal = (page.Width.Millimeter / 25.4) * 72 - (x * 2);
                    double vertical = (page.Height.Millimeter / 25.4) * 72 - (y * 2);

                    //draw svartram
                    XRect rect = new XRect(x - 2, y - oneCM- 2, horizontal + 4, vertical + 4);
                    gfx.DrawRectangle(XBrushes.Black, rect);
                    gfx.DrawImage(image, x, y - oneCM, horizontal, vertical);


                }
                else
                {
                    double horizontal = (page.Width.Millimeter / 25.4) * 72 - (x * 2);
                    double vertical = (page.Height.Millimeter / 25.4) * 72 - (y * 2);
                    gfx.DrawImage(image, x, y, horizontal, vertical);
                }
           
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="gfx"></param>
        /// <param name="fontName"></param>
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
        /// 
        /// </summary>
        /// <param name="gfx"></param>
        /// <param name="fontName"></param>
        /// <param name="text"></param>
        /// <param name="x"></param>
        /// <param name="y"></param>
        private void drawTextTitle(XGraphics gfx, string fontNameTitle, string text, int x, int y, int height = 20)
        {
            XColor color = XColors.Black;
            XFont font = new XFont(fontNameTitle, height, XFontStyle.Bold);
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
        private byte[] createPdf(Image img, MapExportItem exportItem, string fontName, string fontNameTitle)
        {
            PdfDocument document = new PdfDocument();
            PdfPage page = document.AddPage();

            page.Size = GetPageSize(exportItem);
            page.Orientation = exportItem.orientation == "L" ? PdfSharp.PageOrientation.Landscape : PdfSharp.PageOrientation.Portrait;

            XGraphics gfx = XGraphics.FromPdfPage(page);

            int scale = int.Parse(exportItem.scale);
            double length = (1.0 / scale);
            double pixelLength = 2.82e3;

            //adding support for scalebar with different size, orientation and scales
            if (!ConfigurationManager.AppSettings.AllKeys.Contains("exportScalebarSettings") || ConfigurationManager.AppSettings["exportScalebarSettings"] == "")
            {
                pixelLength = 2.82e3;
            }
            else
            {
                // exportScalebarSettings has been added to web.config
                //string json = {"A3":{"Landscape":{"1000":"2.84e3",...},"Portrait":{"1000":"2.84e3",...}},"A4":{"Landscape":{"1000":"2.84e3",...},"Portrait":{"1000":"2.84e3",...}},}
                var scalebarJson = System.Text.ASCIIEncoding.ASCII.GetString(System.Convert.FromBase64String(ConfigurationManager.AppSettings["exportScalebarSettings"]));
                var values = JsonConvert.DeserializeObject<Dictionary<string, Dictionary<string, Dictionary<int, float>>>>(scalebarJson);
                pixelLength = values[page.Size.ToString()][page.Orientation.ToString()].ContainsKey(scale) ? values[page.Size.ToString()][page.Orientation.ToString()][scale] : pixelLength;
            }


            double unitLength = length * pixelLength;

            Dictionary<int, string> scaleBarTexts = new Dictionary<int, string>()
                    {
                        {250, "25 m"},
                        {500, "50 m"},
                        {1000, "50 m"},
                        {2000, "100 m"},
                        {2500, "100 m"},
                        {5000, "200 m"},
                        {10000, "500 m"},
                        {20000, "1 km"},
                        {25000, "1 km"},
                        {50000, "2 km"},
                        {100000, "5 km"},
                        {200000, "10 km"},
                        {250000, "10 km"},
                        {300000, "10 km"}
                    };

            Dictionary<int, int> scaleBarLengths = new Dictionary<int, int>()
                    {
                        {250, 25},
                        {500, 50},
                        {1000, 50},
                        {2000, 100},
                        {2500, 100},
                        {5000, 200},
                        {10000, 500},
                        {20000, 1000},
                        {25000, 1000},
                        {50000, 2000},
                        {100000, 5000},
                        {200000, 10000},
                        {250000, 10000},
                        {300000, 10000}
                    };

            int displayLength = GetDisplayLength(unitLength, scaleBarLengths, scale);
            string displayText = GetDisplayText(unitLength, scaleBarTexts, scale);
            string commentText = String.Empty;
            if (exportItem.comments != null)
            {
                commentText = exportItem.comments;
            }

            string titleText = String.Empty;
            if (exportItem.pdftitle != null)
            {
                titleText = exportItem.pdftitle;
                //titleText = titleText.ToUpper();
            }
            DateTime thisDay = DateTime.Today;
            string pdfDate = thisDay.ToString("d");
            // Display date using short date string.

            // adding support for different layouts
            int layout = ConfigurationManager.AppSettings["exportLayout"] != null ? int.Parse(ConfigurationManager.AppSettings["exportLayout"]) : 1;
            //string fontNameForText = string.IsNullOrEmpty(ConfigurationManager.AppSettings["exportFontNameText"])?"Verdana" : ConfigurationManager.AppSettings["exportFonNameText"];
            if (layout == 1)//original layout
            {
                //origina code from github
                this.drawImage(gfx, img, 0, 0, page, layout);

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

                this.drawTextTitle(gfx, fontName, titleText, 15, 25);

                int height = 65 + copyrights.Count * 10;

                XPoint[] points = new XPoint[]
                {
                    new XPoint(15, 35),
                    new XPoint(15, height),
                    new XPoint(70 + displayLength, height),
                    new XPoint(70 + displayLength, 35),
                    new XPoint(15, 35)
                 };

                gfx.DrawPolygon(XBrushes.White, points, XFillMode.Winding); // kollar vad det är

                this.drawText(gfx, fontName, String.Format("Skala 1:{0}", exportItem.scale), 15, 25);
                gfx.DrawLine(XPens.Black, new XPoint(15, 32), new XPoint(15 + displayLength, 32));
                gfx.DrawLine(XPens.Black, new XPoint(15, 28), new XPoint(15, 36));
                gfx.DrawLine(XPens.Black, new XPoint(15 + displayLength, 28), new XPoint(15 + displayLength, 36));
                this.drawText(gfx, fontName, displayText, 20 + displayLength, 35);

                var y = (int)page.Height.Point - 15;
                var printText = commentText + "   " + pdfDate;
                this.drawText(gfx, fontName, printText, 15, y - 20);

                this.drawText(gfx, fontName, infoText, 15, y);

                int i = 0;
                copyrights.ForEach(copyright =>
                {
                    int start = 70;
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
                double whiteScale = 0.08; // 8% margin on each side. This has to be the same as the margin in export.js!!! Otherwise the scale will be incorrect!
                this.drawImage(gfx, img, page.Width.Point * whiteScale, page.Height.Point * whiteScale, page, layout);

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

                this.drawTextTitle(gfx, fontNameTitle, titleText, 30, 35); //changed from 27 to 35 (y)

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
                this.drawText(gfx, fontName, String.Format("Skala 1:{0}", exportItem.scale), 40, (int)page.Height.Point - 30, 5); //skala 1:xx
                gfx.DrawLine(XPens.Black, new XPoint(40, (int)page.Height.Point - 26), new XPoint(40 + displayLength, (int)page.Height.Point - 26)); //scalebar
                gfx.DrawLine(XPens.Black, new XPoint(40, (int)page.Height.Point - 23), new XPoint(40, (int)page.Height.Point - 29)); //left
                gfx.DrawLine(XPens.Black, new XPoint(40 + (displayLength / 2), (int)page.Height.Point - 25), new XPoint(40 + (displayLength / 2), (int)page.Height.Point - 27)); //middle
                gfx.DrawLine(XPens.Black, new XPoint(40 + displayLength, (int)page.Height.Point - 23), new XPoint(40 + displayLength, (int)page.Height.Point - 29)); //right
                this.drawText(gfx, fontName, displayText, 45 + displayLength, (int)page.Height.Point - 26, 5); //text "X m" next to the scale bar

                var y = (int)page.Height.Point - 2;

                var printText = commentText + "   " + pdfDate;
                this.drawText(gfx, fontName, printText, 40, y - 38, 8); // comment

                this.drawText(gfx, fontName, infoText, 40, y - 13, 5); // text "kartled..."

                int i = 0;
                copyrights.ForEach(copyright =>
                {
                    int start = (int)page.Height.Point - 15;
                    this.drawText(gfx, fontName, String.Format("© {0}", copyright), (int)page.Width.Point - 120, start - 15 + i * 10, 8); // coyright
                    i++;
                });

                XImage logo = XImage.FromFile(Path.Combine(HostingEnvironment.ApplicationPhysicalPath, "assets", "logo.png"));
                gfx.DrawImage(logo, (gfx.PageSize.Width - logo.PixelWidth / 5) - 33, 7.5, logo.PixelWidth / 5, logo.PixelHeight / 5); //logotype

                byte[] bytes;

                using (MemoryStream ms = new MemoryStream())
                {
                    document.Save(ms);
                    bytes = ReadFully(ms);
                }

                return bytes;
            }
            else if (layout == 3)//new layout
                // kodändringar krävs när man byter logo, copyrights och % för marginal
            {
                // x and y 0 0(top left corner?)-> change
                double xWhiteScale = 0.10; // 10% margin on each side. This has to be the same as the margin in export.js!!! Otherwise the scale will be incorrect!
                double yWhiteScale = 0.12; // 12% margin on each side. This has to be the same as the margin in export.js!!! Otherwise the scale will be incorrect!
                double oneCM = page.Height.Point * 0.02;
                this.drawImage(gfx, img, page.Width.Point * xWhiteScale, page.Height.Point * yWhiteScale, page, layout);

               

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

                string sourceText = String.Empty;
                if (ConfigurationManager.AppSettings["exportSourceText"] != null)
                {
                    sourceText = ConfigurationManager.AppSettings["exportSourceText"];
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

                //define x and y for each corner (kartbild)
                int xLeft = (int)(page.Width.Point * xWhiteScale);
                int xRight =(int)(page.Width.Point) - xLeft;
                int yWhiteSpace = (int)(page.Height.Point * yWhiteScale);
                int yBottom = (int)(page.Height.Point - yWhiteSpace);


                gfx.DrawPolygon(XBrushes.White, points, XFillMode.Winding);

                //scaleText "Skala 1:{0}"
                string scaleTextScalebar = exportItem.scale;
                if (int.Parse(exportItem.scale)> 1000)
                {
                    scaleTextScalebar = exportItem.scale.Substring(0, exportItem.scale.Length - 3) + " " + exportItem.scale.Substring(exportItem.scale.Length - 3);
                }

                bool showScale = false;
                string[] scales = ConfigurationManager.AppSettings["scaleStep"].Split(',');
                foreach (var s in scales)
                {
                    if (s == exportItem.scale)
                    {
                        showScale = true;
                        break;
                    }
                }
                int yScaleText = 0; // Defined here to be used for the northArrow
                if (showScale)
                {
                    // skalstocken x y
                    int xLeftAfterScale = xLeft + 100;
                    yScaleText = (int)(yBottom + (yWhiteSpace * 0.38));
                    int yScalebarTop = (int)(yBottom + (yWhiteSpace * 0.30)); //29
                    int yScalebarMiddle = (int)(yBottom + (yWhiteSpace * 0.35)); //26
                    int yScalebarBottom = (int)(yBottom + (yWhiteSpace * 0.40)); //23
                    this.drawText(gfx, fontName, String.Format("Skala 1:{0}", scaleTextScalebar), xLeft, yScaleText, 12); //skala 1:xx
                    gfx.DrawLine(XPens.Black, new XPoint(xLeftAfterScale, yScalebarMiddle), new XPoint(xLeftAfterScale + displayLength, yScalebarMiddle)); //scalebar
                    gfx.DrawLine(XPens.Black, new XPoint(xLeftAfterScale, yScalebarBottom), new XPoint(xLeftAfterScale, yScalebarTop)); //left
                    gfx.DrawLine(XPens.Black, new XPoint(xLeftAfterScale + (displayLength / 2), yScalebarMiddle - 2), new XPoint(xLeftAfterScale + (displayLength / 2), yScalebarMiddle + 2)); //middle
                    gfx.DrawLine(XPens.Black, new XPoint(xLeftAfterScale + displayLength, yScalebarBottom), new XPoint(xLeftAfterScale + displayLength, yScalebarTop)); //right
                    this.drawText(gfx, fontName, displayText, xLeftAfterScale + 5 + displayLength, yScaleText, 12); //text "X m" next to the scale bar
                }else
                {
                    int xLeftAfterScale = xLeft + 100;
                    yScaleText = (int)(yBottom + (yWhiteSpace * 0.38));
                    int yScalebarTop = (int)(yBottom + (yWhiteSpace * 0.30)); //29
                    int yScalebarMiddle = (int)(yBottom + (yWhiteSpace * 0.35)); //26
                    int yScalebarBottom = (int)(yBottom + (yWhiteSpace * 0.40)); //23
                    this.drawText(gfx, fontName, String.Format("Skala 1:{0}", scaleTextScalebar), xLeft, yScaleText, 12); //skala 1:xx
                }

                //comment
                //make a box
                XStringFormat myComment = new XStringFormat();
                myComment.LineAlignment = XLineAlignment.Center;
                myComment.Alignment = XStringAlignment.Center;

                XColor colorComment = XColors.Black;
                XFont fontComment = new XFont(fontName, 12, XFontStyle.Bold);
                XBrush brushComment = new XSolidBrush(colorComment);

                //place the comment
                var printText = commentText;
                int yKomment = (int)(yBottom + (yWhiteSpace * 0.05));//**yLeftBottom + number(>font size)
                gfx.DrawString(printText, fontComment, brushComment, xLeft, yKomment);
                //this.drawText(gfx, fontName, printText, xLeft, yKomment, 12); // comment 
                

                //text "kartled..."
                int yTextBottom = (int)(yBottom + (yWhiteSpace * 0.60));
                this.drawText(gfx, fontName, infoText, xLeft, yTextBottom, 9); // text "kartled..."

                

                //gfx.DrawString(sourceText, fontSource, brushSource, xRight - 125, (int)(page.Height.Point * yWhiteScale) - (int)oneCM - 15);
                //this.drawText(gfx, fontName, sourceText, xRight - 125, (int)(page.Height.Point * yWhiteScale) - (int)oneCM - 15, 9);


                // copyright ** use xRect/XStringFormat(?) to place the copyrights instead of using pixel
                int i = 0;
                copyrights.ForEach(copyright =>
                {
                    int startOrg= (int)page.Height.Point - 15;
                    this.drawText(gfx, fontName, String.Format("© {0}", copyright), xRight - 90,  yKomment+ i * 12, 9); // copyright
                    i++;
                });

                XImage logo = XImage.FromFile(Path.Combine(HostingEnvironment.ApplicationPhysicalPath, "assets", "logo.png"));
                var logo1Path = HostingEnvironment.ApplicationPhysicalPath + ConfigurationManager.AppSettings["exportLogotype"];
                XImage logo1 = XImage.FromFile(logo1Path);
                
                var northArrowPath = HostingEnvironment.ApplicationPhysicalPath + ConfigurationManager.AppSettings["exportNorthArrow"];
                XImage northArrow = XImage.FromFile(northArrowPath);


                // Layout3 title
                XStringFormat myTitle = new XStringFormat();
                myTitle.LineAlignment = XLineAlignment.Center;
                myTitle.Alignment = XStringAlignment.Center;


                XStringFormat mySource = new XStringFormat();
                mySource.LineAlignment = XLineAlignment.Center;
                mySource.Alignment = XStringAlignment.Far;

                XColor color = XColors.Black;
                XFont font = new XFont(fontNameTitle, 20, XFontStyle.Bold);
                XBrush brush = new XSolidBrush(color);
                
                XColor colorSource = XColors.Black;
                XFont fontSource = new XFont(fontName, 9, XFontStyle.Regular);
                XBrush brushSource = new XSolidBrush(colorSource);

                //logotype title and date
                var printDate = pdfDate;
                XRect rectForDate = new XRect(xRight - 125, page.Height.Point * yWhiteScale - oneCM - 35, 125, 0);
                XFont fontSourceDate = new XFont(fontName, 12, XFontStyle.Regular);
                double northArrowScale = 0.1;

                if (page.Size.ToString() == "A4" && page.Orientation.ToString() == "Landscape") {
                    gfx.DrawString(titleText, font, brush, (int)page.Width.Point / 2, (int)(page.Height.Point * yWhiteScale) - oneCM - 20, myTitle);
                    gfx.DrawString(printDate, fontSourceDate, brushSource, rectForDate, mySource); // date (x:(int)page.Width.Point - (int)(page.Width.Point * whiteScale *2 + 20))
                    gfx.DrawRectangle(XPens.Transparent, rectForDate);
                    // this.drawText(gfx, fontName, printDate, xRight - 80, (int)(page.Height.Point * yWhiteScale) - (int)oneCM - 15, 12); // gamla
                    gfx.DrawImage(logo1, xLeft, (page.Height.Point * yWhiteScale) - oneCM - (logo.PixelHeight * 0.26), logo.PixelWidth * 0.12, logo.PixelHeight * 0.24);
                    gfx.DrawImage(northArrow, xLeft + 1, yScaleText - 15 - northArrow.PixelHeight * northArrowScale, northArrow.PixelWidth * northArrowScale, northArrow.PixelHeight * northArrowScale); //north arrow
                }
                else
                {
                    gfx.DrawString(titleText, font, brush, (int)page.Width.Point / 2, (int)(page.Height.Point * yWhiteScale) - oneCM - 40, myTitle);
                    gfx.DrawString(printDate, fontSourceDate, brushSource, rectForDate, mySource); // date (x:(int)page.Width.Point - (int)(page.Width.Point * whiteScale *2 + 20))
                    gfx.DrawRectangle(XPens.Transparent, rectForDate);
                    //this.drawText(gfx, fontName, printDate, xRight - 80, (int)(page.Height.Point * yWhiteScale) - (int)oneCM - 35, 12); // gamla
                    gfx.DrawImage(logo1, xLeft, (page.Height.Point * yWhiteScale) - oneCM - (logo.PixelHeight * 0.45), logo.PixelWidth * 0.18, logo.PixelHeight * 0.4); //logotype
                    gfx.DrawImage(northArrow, xLeft + 1, yScaleText - 15 - northArrow.PixelHeight * northArrowScale, northArrow.PixelWidth * northArrowScale, northArrow.PixelHeight * northArrowScale); //north arrow
                }


                //text "kartunderlag..."
                //make a box

                int ySourceText = (int)(yBottom + (yWhiteSpace * 0.70));
                XRect rectForText = new XRect(xRight - 125, page.Height.Point * yWhiteScale - oneCM - 15, 125, 0);
                gfx.DrawString(sourceText, fontSource, brushSource, rectForText, mySource);
                gfx.DrawRectangle(XPens.Transparent, rectForText);

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
                return (int)(unitLength * scaleBarLength);
            }
            if (scale <= 500)
            {
                return (int)(unitLength * (scale / 10));
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
            if (scale <= 500)
            {
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

        public byte[] Create(MapExportItem exportItem, string fontName, string fontNameTitle)
        {
            return this.createPdf(MapImageCreator.GetImage(exportItem), exportItem, fontName, fontNameTitle);
        }
    }
}
