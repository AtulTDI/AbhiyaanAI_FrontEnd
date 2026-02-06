type Listener = (data?: any) => void;

class EventBus {
  private listeners: Record<string, Listener[]> = {};

  on(event: string, callback: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Listener) {
    this.listeners[event] = this.listeners[event]?.filter(
      (listener) => listener !== callback
    ) || [];
  }

  emit(event: string, data?: any) {
    this.listeners[event]?.forEach((listener) => listener(data));
  }
}

export const eventBus = new EventBus();