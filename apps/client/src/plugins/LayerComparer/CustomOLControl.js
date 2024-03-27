import Control from "ol/control/Control";
import { getRenderPixel } from "ol/render";
import "./index.css";

export default class OlSideBySideControl extends Control {
  #container = null;
  #divider = null;
  #range = null;

  constructor() {
    const container = document.createElement("div");

    const divider = document.createElement("div");
    divider.className = "ol-side-by-side-divider";

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
      this.updateClip();
    });
  }

  updateClip() {
    this.#divider.style.left = this.#getPosition() + "px";
    this.getMap().render();
  }

  #getPosition() {
    const rangeValue = this.#range.value;
    const offset = (0.5 - rangeValue) * (2 * 0 + 42);
    const size = this.getMap().getSize();
    return size[0] * Number(rangeValue) + offset;
  }

  #prerenderLeft = (event) => {
    const ctx = event.context;
    const mapSize = this.getMap().getSize();
    const width = this.#getPosition();

    const tl = getRenderPixel(event, [0, 0]);
    const tr = getRenderPixel(event, [width, 0]);
    const bl = getRenderPixel(event, [width, mapSize[1]]);
    const br = getRenderPixel(event, [0, mapSize[1]]);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(tl[0], tl[1]);
    ctx.lineTo(tr[0], tr[1]);
    ctx.lineTo(bl[0], bl[1]);
    ctx.lineTo(br[0], br[1]);
    ctx.closePath();
    ctx.clip();
  };

  #prerenderRight = (event) => {
    const ctx = event.context;
    const mapSize = this.getMap().getSize();
    const width = this.#getPosition();

    const tl = getRenderPixel(event, [width, 0]);
    const tr = getRenderPixel(event, [mapSize[0], 0]);
    const bl = getRenderPixel(event, mapSize);
    const br = getRenderPixel(event, [width, mapSize[1]]);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(tl[0], tl[1]);
    ctx.lineTo(tr[0], tr[1]);
    ctx.lineTo(bl[0], bl[1]);
    ctx.lineTo(br[0], br[1]);
    ctx.closePath();
    ctx.clip();
  };

  #postrender(event) {
    const ctx = event.context;
    ctx.restore();
  }

  #unsetLayers = () => {
    // Grab previous compare layer and hide them
    this.getMap()
      .getLayers()
      .getArray()
      .filter(
        (l) =>
          l.get("isLeftCompareLayer") === true ||
          l.get("isRightCompareLayer") === true
      )
      .forEach((l) => {
        l.set("visible", false, true);
        if (l.get("isLeftCompareLayer") === true) {
          l.set("isLeftCompareLayer", false);
          l.un("prerender", this.#prerenderLeft);
        } else {
          l.set("isRightCompareLayer", false);
          l.un("prerender", this.#prerenderRight);
        }
        l.un("postrender", this.#postrender);
      });
  };

  setCompareLayers(leftLayer, rightLayer) {
    // Unset possible previous compare layers
    this.#unsetLayers();

    // Set visibility, silently (don't trigger a map render at this time)
    leftLayer.set("visible", true, true);

    // Set a unique flag - used later
    leftLayer.set("isLeftCompareLayer", true);

    // Add the render event handler that will split the screen in two
    leftLayer.on("prerender", this.#prerenderLeft);
    leftLayer.on("postrender", this.#postrender);

    // Do the same for the other side of the screen
    rightLayer.set("visible", true, true);
    rightLayer.set("isRightCompareLayer", true);
    rightLayer.on("prerender", this.#prerenderRight);
    rightLayer.on("postrender", this.#postrender);
  }

  remove() {
    // Hide previous compare layers and remove custom render handlers
    this.#unsetLayers();

    // Remove the DIV. Do it in a try/catch, else the DOM will throw
    // an error if element can't be found.
    try {
      this.#container.removeChild(this.#divider);
      this.#container.removeChild(this.#range);
    } catch (error) {}
  }

  open() {
    this.#container.appendChild(this.#divider);
    this.#container.appendChild(this.#range);
    this.#addEvents();
  }
}
