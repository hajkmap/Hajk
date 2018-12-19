using System;
using System.Collections.Generic;
using System.Drawing;
using SharpMap;
using SharpMap.Layers;
using SharpMap.Rendering;

namespace MapService.Components.MapExport.SharpMapExtensions {
    public class LayerCollectionRendererThrowsException : LayerCollectionRenderer {
        public LayerCollectionRendererThrowsException(ICollection<ILayer> layers) : base(layers)
        {
        }

        /// <summary>
        /// Invokes the rendering of the layer; 
        /// Depending on the setting of ContinueOnError for the layer, 
        /// either a red X is drawn if it fails, or an exception is thrown.
        /// </summary>
        /// <param name="layer"></param>
        /// <param name="g"></param>
        /// <param name="map"></param>
        public static void RenderLayer(ILayer layer, Graphics g, Map map) {
			layer.Render(g, map);
			//try
			//{
			//	layer.Render(g, map);
			//}
			//catch (Exception ex)
			//{
			//	if (ContinueOnError(layer))
			//	{
			//		using (Pen pen = new Pen(Color.Red, 4f))
			//		{
			//			Size size = map.Size;
			//			g.DrawLine(pen, 0, 0, size.Width, size.Height);
			//			g.DrawLine(pen, size.Width, 0, 0, size.Height);
			//			g.DrawRectangle(pen, 0, 0, size.Width, size.Height);
			//		}
			//	}
			//	else
			//	{
			//		throw ex;
			//	}
			//}
		}

        private static bool ContinueOnError(ILayer layer)
        {
            WmsLayer wmsLayer = layer as WmsLayer;
            if (wmsLayer != null)
            {
                return wmsLayer.ContinueOnError;
            }
            return true;
        }
    }
}