import Control from "ol/control/Control";
import { getRenderPixel } from "ol/render";
import "./index.css";

function asArray(arg) {
  return arg === "undefined" ? [] : Array.isArray(arg) ? arg : [arg];
}

export default class OlSideBySideControl extends Control {
  constructor() {
    let container = document.createElement("div");
    let divider = document.createElement("div");
    divider.className = "ol-side-by-side-divider";
    divider.addEventListener("click", function () {
      alert(1);
    });
    let range = document.createElement("input");
    range.type = "range";
    range.min = 0;
    range.max = 1;
    range.step = "any";
    range.value = 0.5;
    range.className = "ol-side-by-side-range";

    super({
      element: container,
    });

    this._container = container;
    this._divider = divider;
    this._range = range;
    this._leftLayers = [];
    this._rightLayers = [];
    this._leftLayer = null;
    this._rightLayer = null;

    //this.open();
  }

  _addEvents() {
    this._range.addEventListener("input", () => {
      this._updateClip();
    });
  }

  _updateClip() {
    this._divider.style.left = this._getPosition() + "px";
    this.getMap().render();
  }

  _getPosition() {
    let rangeValue = this._range.value;
    let offset = (0.5 - rangeValue) * (2 * 0 + 42);
    let size = this.getMap().getSize(); // [width, height]
    return size[0] * Number(rangeValue) + offset;
  }

  _updateLayer(layers, layer) {
    let _layers = asArray(layer);
    _layers.forEach((layer) => {
      if (layers.indexOf(layer) >= 0) return;
      let ind = this.getMap().getLayers().getArray().indexOf(layer);
      if (ind >= 0) {
        console.log("ind: ", ind);
        layer = this.getMap().getLayers().item(ind);
        layer.setVisible(true);
      } else {
        console.log("!!!ADDING NEW LAYER!!!");
        this.getMap().addLayer(layer);
      }
      layers.push({
        layer: layer,
        postrender: null,
        prerender: null,
      });
    });

    this._addLayerEvent(this._leftLayers, "left");
    this._addLayerEvent(this._rightLayers, "right");

    this._updateClip();
  }

  _addLayerEvent(layers, side) {
    layers.forEach((layer) => {
      if (layer.prerender) {
        layer.layer.un("postrender", layer.postrender);
        layer.postrender = null;
      }
      if (layer.postrender) {
        layer.layer.un("prerender", layer.prerender);
        layer.prerender = null;
      }
      layer.postrender = layer.layer.on("postrender", this._postrender(side));
      layer.prerender = layer.layer.on("prerender", this._prerender(side));
    });
  }

  _removeLayers(layers) {
    layers.forEach((layer) => {
      console.log("remove layer: ", layer);
      if (layer.prerender) {
        layer.layer.un("prerender", layer.prerender);
        layer.prerender = null;
      }
      if (layer.postrender) {
        layer.layer.un("postrender", layer.postrender);
        layer.postrender = null;
      }
      layer.layer.setVisible(false);
      // this.getMap().removeLayer(layer.layer);
    });
  }

  ///call back///////////////////////////////////////////////////////////////////////////////////////////////////
  _postrender(side) {
    return function (event) {
      let ctx = event.context;
      ctx.restore();
    };
  }

  _prerender(side) {
    let that = this;
    return function (event) {
      let ctx = event.context;
      let mapSize = that.getMap().getSize();
      let width = that._getPosition();
      let tl, tr, bl, br;
      switch (side) {
        case "left":
          tl = getRenderPixel(event, [0, 0]);
          tr = getRenderPixel(event, [width, 0]);
          bl = getRenderPixel(event, [width, mapSize[1]]);
          br = getRenderPixel(event, [0, mapSize[1]]);
          break;
        case "right":
          tl = getRenderPixel(event, [width, 0]);
          tr = getRenderPixel(event, [mapSize[0], 0]);
          bl = getRenderPixel(event, mapSize);
          br = getRenderPixel(event, [width, mapSize[1]]);
          break;
      }

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(tl[0], tl[1]);
      ctx.lineTo(tr[0], tr[1]);
      ctx.lineTo(bl[0], bl[1]);
      ctx.lineTo(br[0], br[1]);
      ctx.closePath();
      ctx.clip();
    };
  }
  ////call back end//////////////////////////////////////////////////////////////////////////////////////////////////

  ///public//////////////////////////////////////////////////////////////////////////////////////////////////
  setLeftLayer(leftLayer) {
    this._removeLayers(this._leftLayers);
    this._updateLayer(this._leftLayers, leftLayer);
    return this;
  }

  setRightLayer(rightLayer) {
    this._removeLayers(this._rightLayers);
    this._updateLayer(this._rightLayers, rightLayer);
    return this;
  }

  remove() {
    this._removeLayers(this._leftLayers);
    this._removeLayers(this._rightLayers);
    this._leftLayer = [];
    this._rightLayer = [];
    // remove div
    try {
      this._container.removeChild(this._divider);
      this._container.removeChild(this._range);
    } catch (error) {
      console.log(error);
    }
  }

  open() {
    this._container.appendChild(this._divider);
    this._container.appendChild(this._range);
    this._addEvents();
  }
  ///public end//////////////////////////////////////////////////////////////////////////////////////////////////
}
