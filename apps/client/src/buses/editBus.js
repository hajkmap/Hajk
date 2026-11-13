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
