using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Net;
using System.Threading;
using BruTile;
using BruTile.Cache;
using Common.Logging;
using GeoAPI.Geometries;

namespace SharpMap.Layers
{
    public class ModTileLayer : TileLayer
    {
        public ModTileLayer(ITileSource tileSource, string layerName) : 
            base(tileSource, layerName)
        {            
        }

        public ModTileLayer(ITileSource tileSource, string layerName, Color transparentColor, bool showErrorInTile) : 
            base(tileSource, layerName, transparentColor, showErrorInTile)
        {
        }

        public ModTileLayer(ITileSource tileSource, string layerName, Color transparentColor, bool showErrorInTile, string fileCacheDir) : 
            base(tileSource, layerName, transparentColor, showErrorInTile, fileCacheDir)
        {
        }

        public ModTileLayer(ITileSource tileSource, string layerName, Color transparentColor, bool showErrorInTile, FileCache fileCache, ImageFormat imgFormat) : 
            base(tileSource, layerName, transparentColor, showErrorInTile, fileCache, imgFormat)
        {
        }

        private void GetTileOnThread(object parameter)
        {
            object[] parameters = (object[])parameter;
            if (parameters.Length != 5) throw new ArgumentException("Five parameters expected");
            ITileProvider tileProvider = (ITileProvider)parameters[0];
            TileInfo tileInfo = (TileInfo)parameters[1];
            //MemoryCache<Bitmap> bitmaps = (MemoryCache<Bitmap>)parameters[2];
            Dictionary<TileIndex, Bitmap> bitmaps = (Dictionary<TileIndex, Bitmap>)parameters[2];
            AutoResetEvent autoResetEvent = (AutoResetEvent)parameters[3];
            bool retry = (bool)parameters[4];

            var setEvent = true;
            try
            {
                byte[] bytes = tileProvider.GetTile(tileInfo);
                Bitmap bitmap = new Bitmap(new MemoryStream(bytes));
                bitmaps.Add(tileInfo.Index, bitmap);
                if (_fileCache != null)
                {
                    AddImageToFileCache(tileInfo, bitmap);
                }
            }
            catch (WebException ex)
            {
                if (retry)
                {
                    GetTileOnThread(new object[] { tileProvider, tileInfo, bitmaps, autoResetEvent, false });
                    setEvent = false;
                    return;
                }
                if (_showErrorInTile)
                {
                    //an issue with this method is that one an error tile is in the memory cache it will stay even
                    //if the error is resolved. PDD.
                    var schema = (TileSchema)_source.Schema;

                    var bitmap = new Bitmap((int)schema.Extent.Width, (int)schema.Extent.Height);
                    //var bitmap = new Bitmap(schema.Width, schema.Height);

                    using (var graphics = Graphics.FromImage(bitmap))
                    {
                        graphics.DrawString(ex.Message, new Font(FontFamily.GenericSansSerif, 12),
                                            new SolidBrush(Color.Black),
                                            new RectangleF(0, 0, (int)schema.Extent.Width, (int)schema.Extent.Height));
                                            //new RectangleF(0, 0, schema.Width, schema.Height));
                    }
                    bitmaps.Add(tileInfo.Index, bitmap);
                }
            }
            catch (Exception ex)
            {
                
            }
            finally
            {
                if (setEvent) autoResetEvent.Set();
            }
        }
    }
}
