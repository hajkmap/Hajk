export default class Plugin {

  constructor(spec) {
    this.map = spec.map;
    this.app = spec.app;
    this.type = spec.type;
    this.options = spec.options;
    this.component = spec.component;
    this.sortOrder = spec.sortOrder || 0;
  }

  isOpen() {
    return this.instance.state.toggled;
  }

  open() {
    return "open";
  }

  close() {
    return "close";
  }

  minimize() {
    return "minimize";
  }

}