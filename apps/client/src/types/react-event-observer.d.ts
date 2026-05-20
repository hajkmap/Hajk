declare module "react-event-observer" {
  type EventName = string;

  export interface EventListener {
    on(type: "error" | "succeed", handler: (error?: any) => void): void;
    off(): void;
    unsubscribe(): void;
  }

  export interface EventObserver {
    on(event: EventName, callback: (data?: any) => void): EventListener;
    subscribe(event: EventName, callback: (data?: any) => void): EventListener;

    off(
      event: EventName,
      listener?: EventListener | ((...args: any[]) => void)
    ): void;
    unsubscribe(
      event: EventName,
      listener?: EventListener | ((...args: any[]) => void)
    ): void;

    publish(event: EventName, data?: any): void;
    trigger(event: EventName, data?: any): void;
    emit(event: EventName, data?: any): void;

    ask<T = any>(
      event: EventName,
      callback?: (data: T | null, err?: any) => void
    ): Promise<T>;
    request<T = any>(
      event: EventName,
      callback?: (data: T | null, err?: any) => void
    ): Promise<T>;

    respond<T = any>(event: EventName, callback: () => T | Promise<T>): void;
    answer<T = any>(event: EventName, callback: () => T | Promise<T>): void;

    silence(event: EventName): void;
    leave(event: EventName): void;

    getEvents(namespace: string): string[];
    getAllEvents(): string[];
    getListeners(event: EventName): EventListener[];
  }

  function createObserver(): EventObserver;

  export default createObserver;
}
