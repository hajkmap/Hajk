export default class Plugin {

  constructor(spec) {
    this.map = spec.map;
    this.app = spec.app;
    this.type = spec.type;
    this.target = spec.target;
    this.component = spec.component;
    this.sortOrder = spec.sortOrder || 0;
  }

  isOpen() {
    return this.instance.state.toggled;
  }

  open() {
    return this.instance.open();
  }

  close() {
    return this.instance.close();
  }

  minimize() {
    return this.instance.minimize();
  }

}