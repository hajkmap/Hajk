import Control from "ol/control/Control";
import { getRenderPixel } from "ol/render";
import "./index.css";

function asArray(arg) {
  return arg === "undefined" ? [] : Array.isArray(arg) ? arg : [arg];
}

export default class OlSideBySideControl extends Control {
  #container = null;
  #divider = null;
  #range = null;
  #leftLayers = [];
  #rightLayers = [];

  constructor() {
    const container = document.createElement("div");
    const divider = document.createElement("div");
    divider.className = "ol-side-by-side-divider";
    divider.addEventListener("click", function () {
      alert(1);
    });
    const range = document.createElement("input");
    range.type = "range";
    range.min = 0;
    range.max = 1;
    range.step = "any";
    range.value = 0.5;
    range.className = "ol-side-by-side-range";

    super({
      element: container,
    });

    this.#container = container;
    this.#divider = divider;
    this.#range = range;
  }

  #addEvents() {
    this.#range.addEventListener("input", () => {
      this.#updateClip();
    });
  }

  #updateClip() {
    this.#divider.style.left = this.#getPosition() + "px";
    this.getMap().render();
  }

  #getPosition() {
    let rangeValue = this.#range.value;
    let offset = (0.5 - rangeValue) * (2 * 0 + 42);
    let size = this.getMap().getSize(); // [width, height]
    return size[0] * Number(rangeValue) + offset;
  }

  #updateLayer(existingLayers, layer) {
    const layers = asArray(layer);
    layers.forEach((layer) => {
      if (existingLayers.indexOf(layer) >= 0) return;
      let ind = this.getMap().getLayers().getArray().indexOf(layer);
      if (ind >= 0) {
        layer = this.getMap().getLayers().item(ind);
        layer.setVisible(true);
      } else {
        this.getMap().addLayer(layer);
      }
      existingLayers.push({
        layer: layer,
        postrender: null,
        prerender: null,
      });
    });

    this.#addLayerEvent(this.#leftLayers, "left");
    this.#addLayerEvent(this.#rightLayers, "right");

    this.#updateClip();
  }

  #addLayerEvent(layers, side) {
    layers.forEach((layer) => {
      if (layer.prerender) {
        layer.layer.un("postrender", layer.postrender);
        layer.postrender = null;
      }
      if (layer.postrender) {
        layer.layer.un("prerender", layer.prerender);
        layer.prerender = null;
      }
      layer.postrender = layer.layer.on("postrender", this.#postrender(side));
      layer.prerender = layer.layer.on("prerender", this.#prerender(side));
    });
  }

  #removeLayers(existingLayers) {
    existingLayers.forEach((layer) => {
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
  #postrender(side) {
    return (event) => {
      const ctx = event.context;
      ctx.restore();
    };
  }

  #prerender(side) {
    return (event) => {
      const ctx = event.context;
      const mapSize = this.getMap().getSize();
      const width = this.#getPosition();
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
        default:
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
    this.#removeLayers(this.#leftLayers);
    this.#updateLayer(this.#leftLayers, leftLayer);
    return this;
  }

  setRightLayer(rightLayer) {
    this.#removeLayers(this.#rightLayers);
    this.#updateLayer(this.#rightLayers, rightLayer);
    return this;
  }

  remove() {
    this.#removeLayers(this.#leftLayers);
    this.#removeLayers(this.#rightLayers);
    this.#leftLayers = [];
    this.#rightLayers = [];
    // remove div
    try {
      this.#container.removeChild(this.#divider);
      this.#container.removeChild(this.#range);
    } catch (error) {
      console.log(error);
    }
  }

  open() {
    this.#container.appendChild(this.#divider);
    this.#container.appendChild(this.#range);
    this.#addEvents();
  }
  ///public end//////////////////////////////////////////////////////////////////////////////////////////////////
}
