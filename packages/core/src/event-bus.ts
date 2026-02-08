// Event Bus
// Event-driven architecture for decoupled services

import { EventEmitter } from 'events';

export interface Event {
  id: string;
  type: string;
  timestamp: Date;
  source: string;
  payload: any;
  metadata?: Record<string, any>;
}

export type EventHandler = (event: Event) => Promise<void> | void;

export class EventBus extends EventEmitter {
  private handlers: Map<string, EventHandler[]> = new Map();
  private eventHistory: Event[] = [];
  private maxHistorySize: number = 1000;

  /**
   * Emit an event
   */
  async emit(eventType: string, payload: any, metadata?: Record<string, any>): Promise<void> {
    const event: Event = {
      id: this.generateEventId(),
      type: eventType,
      timestamp: new Date(),
      source: 'system',
      payload,
      metadata,
    };

    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Emit to handlers
    const handlers = this.handlers.get(eventType) || [];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${eventType}:`, error);
        // Continue with other handlers
      }
    }

    // Also emit to EventEmitter for backward compatibility
    super.emit(eventType, event);
  }

  /**
   * Subscribe to an event
   */
  on(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);

    // Also subscribe to EventEmitter
    super.on(eventType, handler);
  }

  /**
   * Unsubscribe from an event
   */
  off(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }

    super.off(eventType, handler);
  }

  /**
   * Get event history
   */
  getHistory(eventType?: string, limit?: number): Event[] {
    let events = this.eventHistory;
    
    if (eventType) {
      events = events.filter(e => e.type === eventType);
    }

    if (limit) {
      events = events.slice(-limit);
    }

    return events;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}

// Singleton instance
export const eventBus = new EventBus();

// Common event types
export const EventTypes = {
  // Asset events
  ASSET_CREATED: 'asset:created',
  ASSET_UPDATED: 'asset:updated',
  ASSET_DELETED: 'asset:deleted',
  ASSET_PUBLISHED: 'asset:published',
  ASSET_UNPUBLISHED: 'asset:unpublished',
  
  // Format events
  FORMAT_REGISTERED: 'format:registered',
  FORMAT_UNREGISTERED: 'format:unregistered',
  
  // Type events
  TYPE_REGISTERED: 'type:registered',
  TYPE_UNREGISTERED: 'type:unregistered',
  
  // User events
  USER_SUBSCRIBED: 'user:subscribed',
  USER_UNSUBSCRIBED: 'user:unsubscribed',
  
  // Download events
  DOWNLOAD_STARTED: 'download:started',
  DOWNLOAD_COMPLETED: 'download:completed',
  
  // System events
  CONFIG_UPDATED: 'config:updated',
  PLUGIN_ENABLED: 'plugin:enabled',
  PLUGIN_DISABLED: 'plugin:disabled',
} as const;
