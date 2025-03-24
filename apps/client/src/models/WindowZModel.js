// Using this class gives us the oppertunity to control the z-index of the windows,
// even if they are not "hajk-windows".
// Class was added to handle the search window zIndex.
// Previously the zIndex was added by Window.js which made it impossible to handle other elements zIndexes.

class WindowZModel {
  constructor() {
    this.startZIndex = 1000;
    this.initialized = false;
    this.windows = [];
  }

  init(globalObserver) {
    if (this.initialized) {
      console.warn("WindowZModel already initialized");
      return;
    }

    this.initialized = true;

    this.observer = globalObserver;
    this.observer.subscribe(
      "core.window.add",
      this.#handleWindowAdd.bind(this)
    );
    this.observer.subscribe(
      "core.window.remove",
      this.#handleWindowRemove.bind(this)
    );
    this.observer.subscribe(
      "core.window.bringtofront",
      this.#handleBringToFront.bind(this)
    );
  }

  #handleWindowAdd(windowElement) {
    if (!this.windows.includes(windowElement)) {
      this.windows.push(windowElement);
    }
  }

  #handleWindowRemove(windowElement) {
    const index = this.windows.indexOf(windowElement);
    if (index !== -1) {
      this.windows.splice(index, 1);
    }
  }

  #handleBringToFront(windowElement) {
    const index = this.windows.indexOf(windowElement);
    if (index !== -1) {
      this.windows.splice(index, 1);
      this.windows.push(windowElement);
      this.#updateZIndexes();
    }
  }

  #updateZIndexes() {
    this.windows.forEach((windowElement, index) => {
      windowElement.style.zIndex = this.startZIndex + index;

      const isHajkWindow = windowElement.classList.contains("hajk-window");
      const hajkWindowContainer = document.getElementById("windows-container");
      // We need to get past Header on zIndex 1100 and Popper on 1500.
      hajkWindowContainer.style.zIndex = isHajkWindow ? 1500 : null;
    });
  }
}

const instance = new WindowZModel();

export default instance;
