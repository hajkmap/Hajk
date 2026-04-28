import Control from "ol/control/Control";
import { getRenderPixel } from "ol/render";
import "./index.css";

// Maybe these values should be ok?
const DEFAULT_LENS_DIAMETER = 200;
const MIN_LENS_DIAMETER = 60;
const MAX_LENS_DIAMETER = 400;
const LENS_DIAMETER_STEP = 20;

const DEFAULT_TOP_LAYER_OPACITY = 1;
const MIN_TOP_LAYER_OPACITY = 0.1;
const MAX_TOP_LAYER_OPACITY = 1;
const TOP_LAYER_OPACITY_STEP = 0.1;
const KEYDOWN_CAPTURE_OPTIONS = { capture: true }; // Force capture and prevent OL from handling the event.

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default class SpyGlassControl extends Control {
  #container = null;

  #mousePosition = null;

  #topLayer = null;

  // Remembers the top layer's original zIndex so we can restore it when the
  // comparer is closed. We only need to track the top layer — the bottom
  // keeps its original position in the stack.
  #originalTopZIndex = undefined;
  #originalTopOpacity = undefined;

  #isCoarsePointer = false;
  #isOpen = false;
  #lensDiameter = DEFAULT_LENS_DIAMETER;
  #topLayerOpacity = DEFAULT_TOP_LAYER_OPACITY;

  constructor() {
    const container = document.createElement("div");
    container.className = "ol-spyglass-container";

    super({ element: container });

    this.#container = container;
    this.#isCoarsePointer =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(pointer: coarse)").matches;

    this.#container.classList.add(
      this.#isCoarsePointer ? "ol-spyglass--touch" : "ol-spyglass--mouse"
    );
  }

  #addEvents() {
    window.addEventListener(
      "keydown",
      this.#onKeyDown,
      KEYDOWN_CAPTURE_OPTIONS
    );

    // On coarse-pointer (touch) devices the lens stays fixed in the viewport
    // center and the user pans the map as usual, so we don't need any
    // pointer tracking at all. Only attach mouse-follow behaviour on devices
    // that actually have a hovering pointer.
    if (this.#isCoarsePointer) return;

    const viewport = this.getMap().getViewport();
    viewport.addEventListener("pointermove", this.#onViewportPointerMove);
    viewport.addEventListener("pointerleave", this.#onViewportPointerLeave);
  }

  #removeEvents() {
    window.removeEventListener(
      "keydown",
      this.#onKeyDown,
      KEYDOWN_CAPTURE_OPTIONS
    );

    const map = this.getMap();
    const viewport = map ? map.getViewport() : null;

    if (viewport) {
      viewport.removeEventListener("pointermove", this.#onViewportPointerMove);
      viewport.removeEventListener(
        "pointerleave",
        this.#onViewportPointerLeave
      );
    }
  }

  #onKeyDown = (event) => {
    if (!this.#isOpen) return;

    const activeElement = document.activeElement;
    const activeTagName = activeElement?.tagName;
    const isEditingField =
      activeElement?.isContentEditable === true ||
      activeTagName === "INPUT" ||
      activeTagName === "TEXTAREA" ||
      activeTagName === "SELECT";
    if (isEditingField) return;

    const isArrowKey =
      event.key === "ArrowUp" ||
      event.key === "ArrowDown" ||
      event.key === "ArrowLeft" ||
      event.key === "ArrowRight";
    if (!isArrowKey) return;

    // Reserve arrow keys for spyglass interactions while open so OL keyboard
    // pan/zoom interactions don't run at the same time.
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.#handleSizeKey(event.key);
    this.#handleOpacityKey(event.key);
  };

  #handleSizeKey = (key) => {
    if (key === "ArrowUp") return this.increaseLensSize();
    if (key === "ArrowDown") return this.decreaseLensSize();
    return false;
  };

  #handleOpacityKey = (key) => {
    if (key === "ArrowRight") return this.increaseOpacity();
    if (key === "ArrowLeft") return this.decreaseOpacity();
    return false;
  };

  increaseLensSize() {
    const nextDiameter = clamp(
      this.#lensDiameter + LENS_DIAMETER_STEP,
      MIN_LENS_DIAMETER,
      MAX_LENS_DIAMETER
    );
    if (nextDiameter === this.#lensDiameter) return false;
    this.#lensDiameter = nextDiameter;
    this.getMap()?.render();
    return true;
  }

  decreaseLensSize() {
    const nextDiameter = clamp(
      this.#lensDiameter - LENS_DIAMETER_STEP,
      MIN_LENS_DIAMETER,
      MAX_LENS_DIAMETER
    );
    if (nextDiameter === this.#lensDiameter) return false;
    this.#lensDiameter = nextDiameter;
    this.getMap()?.render();
    return true;
  }

  increaseOpacity() {
    const nextOpacity = clamp(
      Math.round((this.#topLayerOpacity + TOP_LAYER_OPACITY_STEP) * 10) / 10,
      MIN_TOP_LAYER_OPACITY,
      MAX_TOP_LAYER_OPACITY
    );
    if (nextOpacity === this.#topLayerOpacity) return false;
    this.#topLayerOpacity = nextOpacity;
    this.#topLayer?.setOpacity(this.#topLayerOpacity);
    this.getMap()?.render();
    return true;
  }

  decreaseOpacity() {
    const nextOpacity = clamp(
      Math.round((this.#topLayerOpacity - TOP_LAYER_OPACITY_STEP) * 10) / 10,
      MIN_TOP_LAYER_OPACITY,
      MAX_TOP_LAYER_OPACITY
    );
    if (nextOpacity === this.#topLayerOpacity) return false;
    this.#topLayerOpacity = nextOpacity;
    this.#topLayer?.setOpacity(this.#topLayerOpacity);
    this.getMap()?.render();
    return true;
  }

  #onViewportPointerMove = (event) => {
    if (!this.#isOpen) return;
    if (event.pointerType !== "mouse") return;

    this.#mousePosition = this.getMap().getEventPixel(event);
    this.getMap().render();
  };

  #onViewportPointerLeave = (event) => {
    if (!this.#isOpen) return;
    if (event.pointerType !== "mouse") return;

    this.#mousePosition = null;
    this.getMap().render();
  };

  // Resolves the current lens position in viewport pixels.
  // - Coarse-pointer / touch: always the geometric map center, so panning the
  //   map moves the world under a fixed lens.
  // - Mouse / pen with hover: wherever the cursor last was, or null when the
  //   cursor has left the viewport.
  #getLensPosition() {
    if (this.#isCoarsePointer) {
      const size = this.getMap()?.getSize();
      if (!size) return null;
      return [size[0] / 2, size[1] / 2];
    }
    return this.#mousePosition;
  }

  #prerenderTop = (event) => {
    const ctx = event.context;
    ctx.save();
    ctx.beginPath();

    const position = this.#getLensPosition();
    if (position) {
      const lensRadius = this.#lensDiameter / 2;
      const pixel = getRenderPixel(event, position);
      const offset = getRenderPixel(event, [
        position[0] + lensRadius,
        position[1],
      ]);
      const canvasRadius = Math.sqrt(
        Math.pow(offset[0] - pixel[0], 2) + Math.pow(offset[1] - pixel[1], 2)
      );
      ctx.arc(pixel[0], pixel[1], canvasRadius, 0, 2 * Math.PI);
      ctx.lineWidth = (3 * canvasRadius) / lensRadius;
      // Keep border opacity independent from top-layer opacity adjustments.
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.stroke();
    }

    ctx.clip();
  };

  #postrenderTop = (event) => {
    const ctx = event.context;
    ctx.restore();
  };

  #unsetLayers = () => {
    const map = this.getMap();
    if (!map) return;

    // Clean up old compare layers, including nested ones, so stale prerender hooks don't leak.
    map
      .getAllLayers()
      .filter(
        (l) =>
          l.get("isBottomCompareLayer") === true ||
          l.get("isTopCompareLayer") === true
      )
      .forEach((l) => {
        l.set("visible", false, true);
        if (l.get("isTopCompareLayer") === true) {
          l.set("isTopCompareLayer", false);
          l.un("prerender", this.#prerenderTop);
          l.un("postrender", this.#postrenderTop);
          // Restore the zIndex we bumped when the layer was activated.
          l.setZIndex(this.#originalTopZIndex);
          this.#originalTopZIndex = undefined;
          l.setOpacity(this.#originalTopOpacity ?? DEFAULT_TOP_LAYER_OPACITY);
          this.#originalTopOpacity = undefined;
        } else {
          l.set("isBottomCompareLayer", false);
        }
      });

    this.#topLayer = null;
    this.#lensDiameter = DEFAULT_LENS_DIAMETER;
    this.#topLayerOpacity = DEFAULT_TOP_LAYER_OPACITY;
  };

  setCompareLayers(bottomLayer, topLayer) {
    this.#unsetLayers();

    // Use the regular setVisible() so OL fires a `change:visible` event and
    // the layer renderer is (re)initialized. Silent sets do not trigger
    // OL's internal visibility handler, which means a compare layer that
    // was previously hidden never gets wired into the render pipeline —
    // the prerender hook below would then never fire for it.
    bottomLayer.setVisible(true);
    bottomLayer.set("isBottomCompareLayer", true);

    // Lift the top layer above the bottom layer so the clipped spyglass
    // circle renders on top. Remember the original zIndex so it can be
    // restored when the comparer closes.
    this.#originalTopZIndex = topLayer.getZIndex();
    this.#originalTopOpacity = topLayer.getOpacity();
    topLayer.setZIndex((bottomLayer.getZIndex() ?? 0) + 1);
    topLayer.setVisible(true);
    topLayer.setOpacity(this.#topLayerOpacity);
    topLayer.set("isTopCompareLayer", true);
    topLayer.on("prerender", this.#prerenderTop);
    topLayer.on("postrender", this.#postrenderTop);
    this.#topLayer = topLayer;

    const map = this.getMap();
    if (map) map.render();
  }

  updateClip() {
    const map = this.getMap();
    if (map) map.render();
  }

  open() {
    if (this.#isOpen) return;
    this.#isOpen = true;

    this.#mousePosition = null;
    this.#addEvents();
  }

  remove() {
    this.#unsetLayers();

    if (this.#isOpen) {
      this.#removeEvents();
      this.#isOpen = false;
    }

    this.#mousePosition = null;
  }
}
