class EventBus {
  constructor() {
    this.target = document.createDocumentFragment();
  }

  on(type, handler) {
    this.target.addEventListener(type, handler);
    return () => this.target.removeEventListener(type, handler);
  }

  emit(type, detail) {
    this.target.dispatchEvent(new CustomEvent(type, { detail }));
  }
}

export const editBus = new EventBus();

// Internal value for "no editable service selected", passed between Sketch and
// AttributeEditor as a service label. It's compared, so it must not be
// translated. Translate it only where it's displayed (key "editing.noService").
export const NO_SERVICE_LABEL = "Ingen";
