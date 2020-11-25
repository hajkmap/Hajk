class Plugin {
  constructor(spec) {
    this.searchInterface = spec.searchInterface;
    this.map = spec.map;
    this.app = spec.app;
    this.type = spec.type;
    this.options = spec.options;
    this.component = spec.component;
    this.sortOrder = spec.sortOrder || 0;
  }
}

export default Plugin;
