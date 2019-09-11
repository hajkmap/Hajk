import { MousePosition } from "ol/control";
class CoordinatesModel {
  constructor(settings) {
    console.log("settings: ", settings);
    this.map = settings.map;
    this.app = settings.app;
    this.localObserver = settings.localObserver;
  }

  activate = () => {
    console.log("activate, this:", this);
    const target = document.getElementById("coordinatesContainer");
    target.childElementCount === 0 &&
      this.map.addControl(
        new MousePosition({
          target,
          undefinedHTML: "Coords here"
        })
      );
  };

  deactivate = () => {
    console.log("deactivate");
  };
}

export default CoordinatesModel;
