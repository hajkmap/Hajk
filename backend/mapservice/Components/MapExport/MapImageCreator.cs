using GeoAPI.Geometries;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace MapService.Components.MapExport
{

    public class MapExportCallback
    {
        public Image image { get; set; }
        public string layerName { get; set; }
    }


    public class MapImageCreator
    {
        /// <summary>
        /// Create a worldfile for georeferencing.
        /// </summary>
        /// <param name="filename"></param>
        /// <param name="exportItem"></param>
        public static byte[] CreateWorldFile(MapExportItem exportItem)
        {                        
            double left = exportItem.bbox[0];
            double right = exportItem.bbox[1];
            double bottom = exportItem.bbox[2];
            double top = exportItem.bbox[3];                  
            /*
            Line 1: A: pixel size in the x-direction in map units/pixel
            Line 2: D: rotation about y-axis
            Line 3: B: rotation about x-axis
            Line 4: E: pixel size in the y-direction in map units, almost always negative[3]
            Line 5: C: x-coordinate of the center of the upper left pixel
            Line 6: F: y-coordinate of the center of the upper left pixel
            */
            double mapWidth = Math.Abs(left - right);
            double mapHeight = Math.Abs(top - bottom);
            double pixelSizeX = mapWidth / exportItem.size[0];
            double pixelSizeY = (-1) * (mapHeight / exportItem.size[1]);
            double x = exportItem.bbox[0];
            double y = exportItem.bbox[3];

            MemoryStream memoryStream = new MemoryStream();
            TextWriter textWriter = new StreamWriter(memoryStream);

            textWriter.WriteLine(pixelSizeX.ForceDecimalPoint());
            textWriter.WriteLine(0);
            textWriter.WriteLine(0);
            textWriter.WriteLine(pixelSizeY.ForceDecimalPoint());
            textWriter.WriteLine(x.ForceDecimalPoint());
            textWriter.WriteLine(y.ForceDecimalPoint());

            textWriter.Flush();
            memoryStream.Flush();

            byte[] bytes = memoryStream.ToArray();

            memoryStream.Close();
            textWriter.Close();

            return bytes;
        }

        /// <summary>
        /// Creates an image to export.
        /// </summary>
        /// <param name="exportItem"></param>
        /// <param name="fileinfo"></param>
        /// <returns>Image</returns>
        public static Image GetImage(MapExportItem exportItem)
        {
            MapExporter mapExporter = new MapExporter(exportItem);

            mapExporter.AddWMTSLayers(exportItem.wmtsLayers);
            mapExporter.AddWMSLayers(exportItem.wmsLayers);
            mapExporter.AddArcGISLayers(exportItem.arcgisLayers);
            mapExporter.AddVectorLayers(exportItem.vectorLayers);            

            double left = exportItem.bbox[0];
            double right = exportItem.bbox[1];
            double bottom = exportItem.bbox[2];
            double top = exportItem.bbox[3];

            Envelope envelope = new Envelope(left, right, bottom, top);
            mapExporter.map.ZoomToBox(envelope);
                                    
            Image i = mapExporter.map.GetMap(exportItem.resolution);            

            Bitmap src = new Bitmap(i);
            src.SetResolution(exportItem.resolution, exportItem.resolution);

            Bitmap target = new Bitmap(src.Size.Width, src.Size.Height);
            target.SetResolution(exportItem.resolution, exportItem.resolution);

            Graphics g = Graphics.FromImage(target);
            g.FillRectangle(new SolidBrush(Color.White), 0, 0, target.Width, target.Height);
            g.DrawImage(src, 0, 0);
            return target;
        }        

    }
}
