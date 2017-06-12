// SharpMap Copyright 2005, 2006 - Morten Nielsen (www.iter.dk)
//
// This file is an extension of SharpMap.
// SharpMap is free software; you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
// 
// SharpMap is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Lesser General Public License for more details.

// You should have received a copy of the GNU Lesser General Public License
// along with SharpMap; if not, write to the Free Software
// Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA 

using System;
using System.Drawing;
using SharpMap;
using SharpMap.Layers;
using SharpMap.Rendering;
using SharpMap.Styles;

namespace MapService.Components.MapExport.SharpMapExtensions {
    public class MapThrowsException : Map {
        public MapThrowsException(Size size) : base(size)
        {
        }

        /// <summary>
        /// Renders the map to an image with the supplied resolution
        /// </summary>
        /// <param name="resolution">The resolution of the image</param>
        /// <returns>The map image</returns>
        public new Image GetMap(int resolution)
        {
            Size size = this.Size;
            int width = size.Width;
            size = this.Size;
            int height = size.Height;
            Image image = (Image)new Bitmap(width, height);
            ((Bitmap)image).SetResolution((float)resolution, (float)resolution);
            Graphics g = Graphics.FromImage(image);
            this.RenderMap(g);
            g.Dispose();
            return image;
        }


        /// <summary>
        /// Renders the map using the provided <see cref="T:System.Drawing.Graphics" /> object.
        /// Uses custom <see cref="LayerCollectionRendererThrowsException"/> in order to honor WmsLayer property ContinueOnError.
        /// If ContinueOnError is false, an exception will be thrown. 
        /// If ContinueOnErrror is true, a red X will be drawn instead of the layer.
        /// </summary>
        /// <param name="g">the <see cref="T:System.Drawing.Graphics" /> object to use</param>
        /// <exception cref="T:System.ArgumentNullException">if <see cref="T:System.Drawing.Graphics" /> object is null.</exception>
        /// <exception cref="T:System.InvalidOperationException">if there are no layers to render.</exception>
        public new void RenderMap(Graphics g)
        {
            OnMapRendering(g);

            if (g == null)
                throw new ArgumentNullException("g", "Cannot render map with null graphics object!");

            //Pauses the timer for VariableLayer
            VariableLayerCollection.Pause = true;

            if ((Layers == null || Layers.Count == 0) && (BackgroundLayer == null || BackgroundLayer.Count == 0) && (VariableLayers == null || VariableLayers.Count == 0))
                throw new InvalidOperationException("No layers to render");

            lock (MapTransform)
            {
                g.Transform = MapTransform.Clone();
            }
            g.Clear(BackColor);
            g.PageUnit = GraphicsUnit.Pixel;

            double zoom = Zoom;
            double scale = double.NaN; //will be resolved if needed

            ILayer[] layerList;
            if (BackgroundLayer != null && BackgroundLayer.Count > 0)
            {
                layerList = new ILayer[BackgroundLayer.Count];
                BackgroundLayer.CopyTo(layerList, 0);
                foreach (ILayer layer in layerList)
                {
                    if (layer.VisibilityUnits == VisibilityUnits.Scale && double.IsNaN(scale))
                    {
                        scale = MapScale;
                    }
                    double visibleLevel = layer.VisibilityUnits == VisibilityUnits.ZoomLevel ? zoom : scale;

                    OnLayerRendering(layer, LayerCollectionType.Background);
                    if (layer.Enabled)
                    {
                        if (layer.MaxVisible >= visibleLevel && layer.MinVisible < visibleLevel)
                        {
                            LayerCollectionRendererThrowsException.RenderLayer(layer, g, this);
                        }
                    }
                    OnLayerRendered(layer, LayerCollectionType.Background);
                }
            }

            if (Layers != null && Layers.Count > 0)
            {
                layerList = new ILayer[Layers.Count];
                Layers.CopyTo(layerList, 0);

                //int srid = (Layers.Count > 0 ? Layers[0].SRID : -1); //Get the SRID of the first layer
                foreach (ILayer layer in layerList)
                {
                    if (layer.VisibilityUnits == VisibilityUnits.Scale && double.IsNaN(scale))
                    {
                        scale = MapScale;
                    }
                    double visibleLevel = layer.VisibilityUnits == VisibilityUnits.ZoomLevel ? zoom : scale;
                    OnLayerRendering(layer, LayerCollectionType.Static);
                    if (layer.Enabled && layer.MaxVisible >= visibleLevel && layer.MinVisible < visibleLevel)
                        LayerCollectionRendererThrowsException.RenderLayer(layer, g, this);
                        
                    OnLayerRendered(layer, LayerCollectionType.Static);
                }
            }

            if (VariableLayers != null && VariableLayers.Count > 0)
            {
                layerList = new ILayer[VariableLayers.Count];
                VariableLayers.CopyTo(layerList, 0);
                foreach (ILayer layer in layerList)
                {
                    if (layer.VisibilityUnits == VisibilityUnits.Scale && double.IsNaN(scale))
                    {
                        scale = MapScale;
                    }
                    double visibleLevel = layer.VisibilityUnits == VisibilityUnits.ZoomLevel ? zoom : scale;
                    if (layer.Enabled && layer.MaxVisible >= visibleLevel && layer.MinVisible < visibleLevel)
                        LayerCollectionRendererThrowsException.RenderLayer(layer, g, this);
                        
                }
            }

#pragma warning disable 612,618
            RenderDisclaimer(g);
#pragma warning restore 612,618

            // Render all map decorations
            foreach (var mapDecoration in Decorations)
            {
                mapDecoration.Render(g, this);
            }
            //Resets the timer for VariableLayer
            VariableLayerCollection.Pause = false;

            OnMapRendered(g);
        }

        [Obsolete]
        private void RenderDisclaimer(Graphics g)
        {
            //Disclaimer
            if (!String.IsNullOrEmpty(Disclaimer))
            {
                var size = VectorRenderer.SizeOfString(g, Disclaimer, DisclaimerFont);
                size.Width = (Single)Math.Ceiling(size.Width);
                size.Height = (Single)Math.Ceiling(size.Height);
                StringFormat sf;
                switch (DisclaimerLocation)
                {
                    case 0: //Right-Bottom
                        sf = new StringFormat();
                        sf.Alignment = StringAlignment.Far;
                        g.DrawString(Disclaimer, DisclaimerFont, Brushes.Black,
                            g.VisibleClipBounds.Width,
                            g.VisibleClipBounds.Height - size.Height - 2, sf);
                        break;
                    case 1: //Right-Top
                        sf = new StringFormat();
                        sf.Alignment = StringAlignment.Far;
                        g.DrawString(Disclaimer, DisclaimerFont, Brushes.Black,
                            g.VisibleClipBounds.Width, 0f, sf);
                        break;
                    case 2: //Left-Top
                        g.DrawString(Disclaimer, DisclaimerFont, Brushes.Black, 0f, 0f);
                        break;
                    case 3://Left-Bottom
                        g.DrawString(Disclaimer, DisclaimerFont, Brushes.Black, 0f,
                            g.VisibleClipBounds.Height - size.Height - 2);
                        break;
                }
            }
        }
    }
}