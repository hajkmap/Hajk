using System;
using System.Drawing;
using System.Net;
using GeoAPI.Geometries;
using SharpMap;
using SharpMap.Layers;
using System.IO;
using System.Globalization;

namespace MapService.Components.MapExport.Extentions
{
    class ArcGISLayer : Layer
    {
        private Envelope envelope;

        private bool transparant = true;

        private string url;

        private string format = "PNG32";        
        
        private string bboxSpatialReference = "3006";

        private string spatialReference = "3006";

        private int dpi;

        private int[] size = new int[] { 256, 256 };

        private int[] layers;        

        public ArcGISLayer(Envelope envelope, string url, int[] layers, string spatialRefereceIn, int dpi = 90)
        {
            this.envelope = envelope;
            this.url = url;
            this.layers = layers;
            this.dpi = dpi;
            this.bboxSpatialReference = spatialRefereceIn;
            this.spatialReference = spatialRefereceIn;
        }

        public override Envelope Envelope
        {
            get
            {
                return this.Envelope;
            }
        }

        public override void Render(Graphics g, MapViewport map)
        {
            string url = this.GetRequestUrl(map.Envelope, map.Size);
            var request = WebRequest.Create(url);
            request.Method = "GET";
            request.Timeout = 20000;

            if (request is HttpWebRequest)
            {
                (request as HttpWebRequest).Accept = "image/png";
                (request as HttpWebRequest).KeepAlive = false;
                (request as HttpWebRequest).UserAgent = "SharpMap-ArcGISLayer";
            }

            try
            {
                using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                {
                    using (Stream responseStream = response.GetResponseStream())
                    {
                        long contentLength = (int)response.ContentLength;
                        Image img;
                        DateTime lastTimeGotData = DateTime.Now;
                        bool moreToRead = true;

                        using (var ms = new MemoryStream())
                        {
                            byte[] buffer = new byte[500000];
                            int read = 0;

                            do
                            {
                                try
                                {
                                    int nr = responseStream.Read(buffer, 0, buffer.Length);
                                    ms.Write(buffer, 0, nr);
                                    read += nr;

                                    if (nr == 0)
                                    {
                                        int testByte = responseStream.ReadByte();
                                        if (testByte == -1)
                                        {                                            
                                            break;
                                        }

                                        if ((DateTime.Now - lastTimeGotData).TotalSeconds > request.Timeout)
                                        {                                            
                                            return;
                                        }                                        
                                                                                
                                        System.Threading.Thread.Sleep(10);
                                    }
                                    else
                                    {
                                        lastTimeGotData = DateTime.Now;
                                    }
                                }
                                catch
                                {
                                    moreToRead = false;
                                }
                            } while (moreToRead);

                            ms.Seek(0, SeekOrigin.Begin);

                            img = Image.FromStream(ms);

                            g.DrawImage(img, Rectangle.FromLTRB(0, 0, map.Size.Width, map.Size.Height));

                        }
                    }
                }
            }            
            catch
            {

            }
        }

        public virtual string GetRequestUrl(Envelope box, Size size)
        {
            //http://ksdgis.se/arcgis/rest/services/hpl/MapServer/export?F=image
            //& FORMAT =PNG32
            //& TRANSPARENT=true
            //& LAYERS=show:0
            //& SIZE=256,256
            //& BBOX=419140.49671874987,6583889.48078125,420691.1121874999,6585440.0962499995
            //& BBOXSR = 3006
            //& IMAGESR = 3006
            //& DPI = 90;            

            NumberFormatInfo nfi = new NumberFormatInfo();
            nfi.NumberDecimalSeparator = ".";

            string[] bbox = new string[4] {
                box.MinX.ToString(nfi),
                box.MinY.ToString(nfi),
                box.MaxX.ToString(nfi),
                box.MaxY.ToString(nfi)
            };

            string sizeString = size.Width + "," + size.Height;

            string url = string.Format(
                "{0}/export?F=image&FORMAT={1}&TRANSPARENT={2}&LAYERS=show:{3}&SIZE={4}&BBOX={5}&BBOXSR={6}&IMAGESR={7}&DPI={8}", 
                this.url, 
                this.format,
                this.transparant,
                String.Join(",", this.layers),
                sizeString,
                String.Join(",", bbox),
                this.bboxSpatialReference,
                this.spatialReference,
                this.dpi
            );

            return url;
        }
    }
}
