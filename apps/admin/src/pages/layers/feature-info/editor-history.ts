export interface EditorSnapshot {
  value: string;
  start: number;
  end: number;
}

const HISTORY_LIMIT = 200;
const TYPE_GROUP_MS = 800;


export class EditorHistory {
  private past: EditorSnapshot[] = [];
  private future: EditorSnapshot[] = [];
  private current: EditorSnapshot;
  private lastKind: "type" | "edit" = "edit";
  private lastAt = 0;

  constructor(value: string) {
    this.current = { value, start: value.length, end: value.length };
  }

  reset(value: string) {
    this.past = [];
    this.future = [];
    this.current = { value, start: value.length, end: value.length };
    this.lastKind = "edit";
    this.lastAt = 0;
  }

  noteCaret(start: number, end: number) {
    this.current = { ...this.current, start, end };
  }

  push(next: EditorSnapshot, coalesce: boolean) {
    if (next.value === this.current.value) {
      this.current = next;
      return;
    }
    const now = Date.now();
    if (coalesce && this.lastKind === "type" && now - this.lastAt < TYPE_GROUP_MS) {
      this.current = next;
      this.lastAt = now;
      return;
    }
    this.past.push(this.current);
    if (this.past.length > HISTORY_LIMIT) this.past.shift();
    this.current = next;
    this.future = [];
    this.lastKind = coalesce ? "type" : "edit";
    this.lastAt = now;
  }

  currentValue(): string {
    return this.current.value;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  undo(): EditorSnapshot | null {
    const previous = this.past.pop();
    if (!previous) return null;
    this.future.push(this.current);
    this.current = previous;
    this.lastKind = "edit";
    return previous;
  }

  redo(): EditorSnapshot | null {
    const next = this.future.pop();
    if (!next) return null;
    this.past.push(this.current);
    this.current = next;
    this.lastKind = "edit";
    return next;
  }
}
