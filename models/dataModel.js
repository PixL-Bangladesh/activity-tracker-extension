/**
 * Data models for Action Tracker extension
 * Defines the structure for storing and organizing captured data
 */

// Session model - represents a complete recording session
class Session {
  constructor(id) {
    this.id = id || generateSessionId();
    this.startTime = Date.now();
    this.endTime = null;
    this.duration = null;
    this.metadata = {};
    this.tabs = {};
    this.events = [];
    this.settings = {};
  }

  // Add metadata about the environment
  addMetadata(metadata) {
    this.metadata = {
      ...this.metadata,
      ...metadata
    };
  }

  // Add a tab to the session
  addTab(tabId, url, title) {
    this.tabs[tabId] = {
      url,
      title,
      startTime: Date.now(),
      events: []
    };
  }

  // End the session
  end() {
    this.endTime = Date.now();
    this.duration = this.endTime - this.startTime;
  }

  // Export session data to JSON
  toJSON() {
    return {
      id: this.id,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.duration,
      metadata: this.metadata,
      tabs: this.tabs,
      settings: this.settings
    };
  }
}

// Event model - base class for all event types
class Event {
  constructor(type) {
    this.type = type;
    this.timestamp = Date.now();
    this.url = window.location.href;
    this.title = document.title;
  }
}

// Mouse event model
class MouseEvent extends Event {
  constructor(type, x, y, target) {
    super(type);
    this.position = {
      clientX: x,
      clientY: y,
      pageX: x + window.scrollX,
      pageY: y + window.scrollY
    };
    this.target = target;
  }
}

// Keyboard event model
class KeyboardEvent extends Event {
  constructor(type, key, code, modifiers, target) {
    super(type);
    this.key = key;
    this.code = code;
    this.modifiers = modifiers;
    this.target = target;
  }
}

// DOM event model
class DOMEvent extends Event {
  constructor(type, target) {
    super(type);
    this.target = target;
  }
}

// Navigation event model
class NavigationEvent extends Event {
  constructor(url, referrer) {
    super('navigation');
    this.url = url;
    this.referrer = referrer;
  }
}

// Network event model
class NetworkEvent extends Event {
  constructor(type, url, method, status, requestId) {
    super(type);
    this.url = url;
    this.method = method;
    this.status = status;
    this.requestId = requestId;
  }
}

// Console event model
class ConsoleEvent extends Event {
  constructor(method, args) {
    super('console');
    this.method = method;
    this.args = args;
  }
}

// Screenshot event model
class ScreenshotEvent extends Event {
  constructor(dataUrl) {
    super('screenshot');
    this.dataUrl = dataUrl;
  }
}

// DOM Snapshot event model
class DOMSnapshotEvent extends Event {
  constructor(snapshot) {
    super('domSnapshot');
    this.snapshot = snapshot;
  }
}

// Accessibility Tree event model
class AccessibilityTreeEvent extends Event {
  constructor(tree) {
    super('accessibilityTree');
    this.tree = tree;
  }
}

// Helper function to generate a unique session ID
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
}

// Export all models
export {
  Session,
  Event,
  MouseEvent,
  KeyboardEvent,
  DOMEvent,
  NavigationEvent,
  NetworkEvent,
  ConsoleEvent,
  ScreenshotEvent,
  DOMSnapshotEvent,
  AccessibilityTreeEvent,
  generateSessionId
};
