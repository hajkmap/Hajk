# EventBus

A simple and lightweight event-bus implementation for communication between components in JavaScript applications.

## Overview

EventBus uses the DOM's `CustomEvent` API to create a centralized messaging system that allows different parts of your application to communicate with each other without direct dependencies.

## Installation

Copy the `EventBus` class to your project and export a singleton instance:

```javascript
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
```

## API

### `on(type, handler)`

Listens to an event.

**Parameters:**

- `type` (string): Event name
- `handler` (function): Callback function that receives the event

**Returns:**

- A cleanup function that unregisters the listener

**Example:**

```javascript
const unsubscribe = editBus.on("my-event", (event) => {
  console.log(event.detail);
});

// Unsubscribe later
unsubscribe();
```

### `emit(type, detail)`

Dispatches an event.

**Parameters:**

- `type` (string): Event name
- `detail` (any): Data to send with the event

**Example:**

```javascript
editBus.emit("my-event", {
  message: "Hello",
  timestamp: Date.now(),
});
```

## Usage

### Vanilla JavaScript

```javascript
import { editBus } from "./EventBus";

// Listen to event
const unsubscribe = editBus.on("user-logged-in", (event) => {
  console.log(`User ${event.detail.username} logged in`);
});

// Emit event
editBus.emit("user-logged-in", {
  username: "johndoe",
  timestamp: Date.now(),
});

// Clean up
unsubscribe();
```

### React

EventBus works perfectly with React hooks. Use `useEffect` to register and clean up listeners:

```javascript
import React, { useEffect, useState } from "react";
import { editBus } from "./EventBus";

function MyComponent() {
  const [pluginSettings, setPluginSettings] = useState({
    title: "Draw",
    color: "#000000",
  });

  useEffect(() => {
    // Register listeners
    const offSelected = editBus.on("edit:service-selected", (ev) => {
      const { title, color, source } = ev.detail || {};

      // Ignore events from sketch
      if (source === "sketch") return;

      setPluginSettings((ps) => ({
        ...ps,
        title: title ?? ps.title,
        color: color ?? ps.color,
      }));
    });

    const offCleared = editBus.on("edit:service-cleared", (ev) => {
      const { source } = ev.detail || {};
      if (source === "sketch") return;

      setPluginSettings({
        title: "Draw",
        color: "#cccccc",
      });
    });

    // Cleanup function runs when component unmounts
    return () => {
      offSelected();
      offCleared();
    };
  }, []); // Empty dependency array = runs only on mount/unmount

  return <div>{pluginSettings.title}</div>;
}
```

### Event Naming

Recommended naming convention for events:

```javascript
// Use colons to group related events
editBus.emit("edit:service-selected", data);
editBus.emit("edit:service-cleared", data);
editBus.emit("edit:feature-saved", data);

// Or namespace with prefix
editBus.emit("map:layer-added", data);
editBus.emit("map:layer-removed", data);
```

## Best Practices

### 1. Always clean up listeners

```javascript
// ✅ GOOD - Listener is removed
useEffect(() => {
  const unsubscribe = editBus.on("my-event", handler);
  return () => unsubscribe();
}, []);

// ❌ BAD - Memory leak!
useEffect(() => {
  editBus.on("my-event", handler);
}, []);
```

### 2. Use source parameter to avoid loops

```javascript
// Component A
editBus.emit("data-changed", {
  value: 123,
  source: "componentA",
});

// Component A's listener
editBus.on("data-changed", (ev) => {
  if (ev.detail.source === "componentA") return; // Ignore own events
  updateData(ev.detail.value);
});
```

### 3. Validate event.detail

```javascript
editBus.on("my-event", (ev) => {
  const { value, type } = ev.detail || {};

  if (!value || !type) {
    console.warn("Invalid event data");
    return;
  }

  // Process event...
});
```

### 4. TypeScript support (optional)

```typescript
interface EventDetail {
  title?: string;
  color?: string;
  source?: string;
}

editBus.on("edit:service-selected", (ev: CustomEvent<EventDetail>) => {
  const { title, color, source } = ev.detail || {};
  // ...
});
```

## Advantages

- ✅ **Simple**: Minimal implementation
- ✅ **Lightweight**: No external library needed
- ✅ **Flexible**: Works with vanilla JS, React, Vue, etc.
- ✅ **Automatic cleanup**: `on()` returns a cleanup function
- ✅ **DOM-based**: Uses the web platform's built-in event system

## Disadvantages

- ⚠️ **No type safety** without TypeScript
- ⚠️ **Harder debugging** than direct function calls
- ⚠️ **Risk of memory leaks** if cleanup is forgotten

## Troubleshooting

### Events don't seem to work

```javascript
// Log all events (if you add wildcard support)
console.log("Listening for events...");
```

### Listener runs multiple times

Check that the cleanup function is actually being called:

```javascript
useEffect(() => {
  const off = editBus.on("my-event", handler);
  return () => {
    console.log("Cleaning up listener");
    off();
  };
}, []);
```

## License

Free to use in your projects.
