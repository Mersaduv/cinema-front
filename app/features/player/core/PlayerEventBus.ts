type EventHandler<T = unknown> = (payload: T) => void;

/**
 * Lightweight typed event bus for decoupling the media engine from UI updates.
 */
export class PlayerEventBus {
  private listeners = new Map<string, Set<EventHandler>>();

  /** Subscribe to an event. Returns unsubscribe function. */
  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const set = this.listeners.get(event)!;
    set.add(handler as EventHandler);

    return () => {
      set.delete(handler as EventHandler);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /** Emit an event to all subscribers. */
  emit<T = unknown>(event: string, payload?: T): void {
    const set = this.listeners.get(event);
    if (!set) {
      return;
    }

    for (const handler of set) {
      try {
        handler(payload);
      } catch {
        // Swallow handler errors in production — controller logs separately in dev.
      }
    }
  }

  /** Remove all listeners. */
  clear(): void {
    this.listeners.clear();
  }
}
