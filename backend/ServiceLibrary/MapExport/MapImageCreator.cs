using GeoAPI.Geometries;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Sweco.Services.MapExport
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
        public static string createWorldFile(string filename, MapExportItem exportItem)
        {
            filename = filename.Replace(".tiff", ".tfw");
            if (!File.Exists(filename))
            {
                double left = exportItem.bbox[0];
                double right = exportItem.bbox[1];
                double bottom = exportItem.bbox[2];
                double top = exportItem.bbox[3];

                using (StreamWriter sw = File.CreateText(filename))
                {
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

                    sw.WriteLine(pixelSizeX.ForceDecimalPoint());
                    sw.WriteLine(0);
                    sw.WriteLine(0);
                    sw.WriteLine(pixelSizeY.ForceDecimalPoint());
                    sw.WriteLine(x.ForceDecimalPoint());
                    sw.WriteLine(y.ForceDecimalPoint());
                }
            }
            return filename;
        }

        /// <summary>
        /// Creates an image to export.
        /// </summary>
        /// <param name="exportItem"></param>
        /// <param name="fileinfo"></param>
        /// <returns>Image</returns>
        public static Image GetImage(MapExportItem exportItem)
        {
            MapExporter MapExporter = new MapExporter(exportItem);

            MapExporter.AddWMSLayers(exportItem.wmsLayers);
            MapExporter.AddVectorLayers(exportItem.vectorLayers);               

            double left = exportItem.bbox[0];
            double right = exportItem.bbox[1];
            double bottom = exportItem.bbox[2];
            double top = exportItem.bbox[3];

            Envelope envelope = new Envelope(left, right, bottom, top);
            MapExporter.map.ZoomToBox(envelope);

            var width = Math.Abs(left - right);
            var scale = MapExporter.map.GetMapScale(exportItem.resolution);

            Image i = MapExporter.map.GetMap(exportItem.resolution);

            Bitmap src = new Bitmap(i);
            src.SetResolution(exportItem.resolution, exportItem.resolution);

            Bitmap target = new Bitmap(src.Size.Width, src.Size.Height);
            target.SetResolution(exportItem.resolution, exportItem.resolution);

            Graphics g = Graphics.FromImage(target);
            g.FillRectangle(new SolidBrush(Color.White), 0, 0, target.Width, target.Height);
            g.DrawImage(src, 0, 0);
            return target;            
        }

        public static void GetImageAsync(MapExportItem exportItem, Action<MapExportCallback> callback)
        {
            MapExporter mapExporter = new MapExporter(exportItem);

            mapExporter.AddWMSLayers(exportItem.wmsLayers);
            mapExporter.AddVectorLayers(exportItem.vectorLayers);
            mapExporter.AddWMTSLayers(exportItem.wmtsLayers, () =>
            {               
                Image img = mapExporter.map.GetMap(exportItem.resolution);

                Bitmap src = new Bitmap(img);
                src.SetResolution(exportItem.resolution, exportItem.resolution);

                Bitmap target = new Bitmap(src.Size.Width, src.Size.Height);
                target.SetResolution(exportItem.resolution, exportItem.resolution);

                Graphics g = Graphics.FromImage(target);
                g.FillRectangle(new SolidBrush(Color.White), 0, 0, target.Width, target.Height);
                g.DrawImage(src, 0, 0);
                
                callback.Invoke(new MapExportCallback()
                {
                    image = img
                });
            });

            double left = exportItem.bbox[0];
            double right = exportItem.bbox[1];
            double bottom = exportItem.bbox[2];
            double top = exportItem.bbox[3];

            Envelope envelope = new Envelope(left, right, bottom, top);
            mapExporter.map.ZoomToBox(envelope);

            var width = Math.Abs(left - right);
            var scale = mapExporter.map.GetMapScale(exportItem.resolution);

            mapExporter.map.GetMap(exportItem.resolution);
        }
    }
}
