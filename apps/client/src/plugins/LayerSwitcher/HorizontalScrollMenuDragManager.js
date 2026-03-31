// Version 8.2.0 of react-horizontal-scrolling-menu removed drag functionality. We need to manage it manually.
// This class is a simple manager for the drag events.
export class HorizontalScrollDragManager {
  constructor() {
    this.clicked = false;
    this.dragging = false;
    this.position = 0;
  }

  dragStart = (event) => {
    if (!event || typeof event.clientX !== "number") {
      return;
    }
    this.position = event.clientX;
    this.clicked = true;
  };

  dragStop = () => {
    window.requestAnimationFrame(() => {
      this.dragging = false;
      this.clicked = false;
    });
  };

  dragMove = (event, cb) => {
    if (!event || typeof event.clientX !== "number") {
      return;
    }
    const newDiff = this.position - event.clientX;

    const movedEnough = Math.abs(newDiff) > 5;

    if (this.clicked && movedEnough) {
      this.dragging = true;
    }

    if (this.dragging && movedEnough) {
      this.position = event.clientX;
      cb(newDiff);
    }
  };
}

export const horizontalScrollDragManager = new HorizontalScrollDragManager();
