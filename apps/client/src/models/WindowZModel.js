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

      // We need to get:
      // Over Header (AppBar) on zIndex 1100 and
      // under Drawer on 1200

      // So 1101 is a good number for zIndex on the window container.
      // If we need to handle more windows than 99 we will need to
      // configure MUI using a theme to change all default zIndexes.

      // Default zIndexes is found here
      // https://mui.com/material-ui/customization/z-index/

      // Below is from the MUI documentation 2025-03-25
      // ---------------------------------------------
      // mobile stepper:  1000
      // fab:             1050
      // speed dial:      1050
      // app bar:         1100
      // drawer:          1200
      // modal:           1300
      // snackbar:        1400
      // tooltip:         1500

      hajkWindowContainer.style.zIndex = isHajkWindow ? 1101 : null;

      /**
       * The structure is like this:
       *
       * Header z 1100
       * ---- Search and Search list, z 1000 + dynamic
       *
       * Window container z null or z 1101 when active
       * ---- Hajk window 1, z 1000 + dynamic
       * ---- Hajk window 2, z 1000 + dynamic
       * ---- Hajk window 3, z 1000 + dynamic
       * ---- etc etc.
       *
       * Popovers z 1300
       */
    });
  }
}

const instance = new WindowZModel();

export default instance;
