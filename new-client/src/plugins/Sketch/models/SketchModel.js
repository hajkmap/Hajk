class SketchModel {
  #options;
  constructor(settings) {
    this.#options = settings.options;
    console.info("Sketch-model initiated, options: ", this.#options);
  }
}
export default SketchModel;
