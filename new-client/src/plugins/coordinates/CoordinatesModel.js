import { MousePosition } from "ol/control";
class CoordinatesModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.options = settings.options;
    this.localObserver = settings.localObserver;
  }

  activate = () => {
    const target = document.getElementById("coordinatesContainer");
    target.childElementCount === 0 &&
      this.map.addControl(
        new MousePosition({
          target,
          undefinedHTML: "Coords here"
        })
      );
  };

  deactivate = () => {};
}

export default CoordinatesModel;
