// Content script for Action Tracker extension
console.log('[Action Tracker] Content script loaded');
let recording = false;
let sessionId = null;
let settings = null;
let events = [];
let eventListeners = [];
let lastClickedElement = null;
let lastInteractionTime = 0;
let extensionContextValid = true;
let lastMousePosition = { x: 0, y: 0 };
let lastDOMSnapshot = null;
let accessibilityTree = null;
let consoleLogsBuffer = [];

// Load html2canvas from lib folder
if (document.head) {
  const html2canvasScript = document.createElement('script');
  html2canvasScript.src = chrome.runtime.getURL('lib/html2canvas.js');
  document.head.appendChild(html2canvasScript);
}

// Handle extension context invalidation
function handleExtensionContextInvalidated() {
  extensionContextValid = false;
  // console.log('[Action Tracker] Extension context invalidated, cleaning up...');

  // Clean up resources
  if (recording) {
    try {
      // Perform minimal cleanup without using chrome APIs
      removeAllEventListeners();
      recording = false;
    } catch (e) {
      // console.error('[Action Tracker] Error during cleanup:', e);
    }
  }
}

// Wrap chrome API calls with error handling
function safeChromeRuntimeSendMessage(message, callback) {
  if (!extensionContextValid) {
    // console.warn('[Action Tracker] Not sending message, extension context invalidated');
    return;
  }

  try {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        const errorMessage = chrome.runtime.lastError.message || '';
        if (errorMessage.includes('Extension context invalidated')) {
          handleExtensionContextInvalidated();
        } else {
          // console.error('[Action Tracker] Runtime error:', errorMessage);
        }
        if (callback) callback(null);
      } else {
        if (callback) callback(response);
      }
    });
  } catch (e) {
    if (e.message && e.message.includes('Extension context invalidated')) {
      handleExtensionContextInvalidated();
    } else {
      // console.error('[Action Tracker] Exception in sendMessage:', e);
    }
    if (callback) callback(null);
  }
}

// Initialize when message is received from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    // console.log(`[Action Tracker] Content script received message: ${request.action}`);

    switch (request.action) {
      case 'ping':
        // Respond to ping to indicate content script is loaded
        // console.log('[Action Tracker] Ping received, responding with pong');
        sendResponse({ pong: true });
        return true; // Keep the message channel open for the async response
        
      case 'initRecording':
        // console.log('[Action Tracker] Initializing recording with session:', request.sessionId);
        initRecording(request.sessionId, request.settings);
        sendResponse({ success: true, message: 'Recording initialized' });
        return true; // Keep the message channel open for the async response
        
      case 'stopRecording':
        // console.log('[Action Tracker] Stopping recording');
        stopRecording();
        sendResponse({ success: true, message: 'Recording stopped' });
        return true; // Keep the message channel open for the async response
        
      case 'getStatus':
        sendResponse({
          recording: recording,
          sessionId: sessionId,
          settings: settings
        });
        return true; // Keep the message channel open for the async response
        
      case 'captureScreenshot':
        captureScreenshot(request.selector)
          .then(imageData => {
            sendResponse({ success: true, imageData: imageData });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
        return true; // Keep the message channel open for async response
        
      default:
        // console.warn(`[Action Tracker] Unknown action: ${request.action}`);
        sendResponse({ success: false, message: `Unknown action: ${request.action}` });
        return true; // Keep the message channel open for the async response
    }
  } catch (error) {
    // console.error('[Action Tracker] Error handling message:', error);
    sendResponse({ success: false, error: error.message });
    return true; // Keep the message channel open for the async response
  }
});

// Initialize recording
function initRecording(id, captureSettings) {
  if (recording) return;

  sessionId = id;
  settings = captureSettings;
  recording = true;

  // console.log(`[Action Tracker] Recording started in tab with settings:`, settings);

  // Capture initial state
  captureInitialState();

  // Set up event listeners based on settings
  setupEventListeners();

  // Override console methods to capture logs if enabled
  if (settings.console) {
    overrideConsoleMethods();
  }
}

// Stop recording
function stopRecording() {
  if (!recording) {
    // console.log('[Action Tracker] Not recording, nothing to stop');
    return;
  }

  // console.log('[Action Tracker] Recording stopped');

  // Remove all event listeners
  removeAllEventListeners();

  // Restore original console methods
  if (settings && settings.console) {
    restoreConsoleMethods();
  }

  // Save any remaining events
  if (events.length > 0) {
    try {
      // Force synchronous save of remaining events
      const eventsToSave = [...events];
      events = [];

      safeChromeRuntimeSendMessage({
        action: 'saveEvent',
        sessionId: sessionId,
        eventData: eventsToSave
      }, response => {
        if (chrome.runtime.lastError) {
          // console.error('[Action Tracker] Error saving final events:', chrome.runtime.lastError);
        } else {
          // console.log(`[Action Tracker] Successfully saved ${eventsToSave.length} final events`);
        }
      });
    } catch (error) {
      // console.error('[Action Tracker] Error during final event save:', error);
    }
  }

  // Reset state
  recording = false;
  sessionId = null;
  settings = null;
  events = [];
  lastMousePosition = { x: 0, y: 0 };
  lastClickedElement = null;
  lastDOMSnapshot = null;
  accessibilityTree = null;
  consoleLogsBuffer = [];
}

// Capture initial state of the page
function captureInitialState() {
  // Record page metadata
  recordEvent({
    type: 'pageLoad',
    timestamp: Date.now(),
    url: window.location.href,
    title: document.title,
    referrer: document.referrer,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  });

  // Capture DOM if enabled
  if (settings.dom) {
    // captureDOM();
  }
}

// Set up event listeners based on settings
function setupEventListeners() {
  // Mouse movement tracking
  if (settings.mouse) {
    addEventListenerWithCleanup(document, 'mousemove', handleMouseMove, { passive: true });
    addEventListenerWithCleanup(document, 'click', handleClick, { passive: false });
    addEventListenerWithCleanup(document, 'contextmenu', handleContextMenu, { passive: false });
    addEventListenerWithCleanup(document, 'mousedown', handleMouseDown, { passive: false });
    addEventListenerWithCleanup(document, 'mouseup', handleMouseUp, { passive: false });
    addEventListenerWithCleanup(document, 'wheel', handleWheel, { passive: true });
  }

  // Keyboard tracking
  if (settings.keyboard) {
    addEventListenerWithCleanup(document, 'keydown', handleKeyDown, { passive: false });
    addEventListenerWithCleanup(document, 'keyup', handleKeyUp, { passive: true });
    addEventListenerWithCleanup(document, 'input', handleInput, { passive: true });
  }

  // Scroll tracking
  addEventListenerWithCleanup(document, 'scroll', handleScroll, { passive: true });

  // Window state tracking
  addEventListenerWithCleanup(document, 'visibilitychange', handleVisibilityChange, { passive: true });
  addEventListenerWithCleanup(window, 'focus', handleWindowFocus, { passive: true });
  addEventListenerWithCleanup(window, 'blur', handleWindowBlur, { passive: true });
  addEventListenerWithCleanup(window, 'resize', handleWindowResize, { passive: true });
}

// Helper to add event listener and track it for cleanup
function addEventListenerWithCleanup(target, type, listener, options) {
  target.addEventListener(type, listener, options);
  eventListeners.push({ target, type, listener, options });
}

// Remove all event listeners
function removeAllEventListeners() {
  eventListeners.forEach(({ target, type, listener, options }) => {
    try {
      target.removeEventListener(type, listener, options);
    } catch (e) {
      // console.error(`[Action Tracker] Error removing event listener ${type}:`, e);
    }
  });
  eventListeners = [];
}

// Capture DOM snapshot
function captureDOM() {
  try {
    const domSnapshot = {
      type: 'domSnapshot',
      timestamp: Date.now(),
      data: document.documentElement.outerHTML
    };

    recordEvent(domSnapshot);
  } catch (error) {
    // console.error('[Action Tracker] Error capturing DOM:', error);
  }
}

// Event handlers
function handleMouseMove(event) {
  if (!recording || !settings.mouse) return;

  // Only record mouse moves at a reasonable interval to avoid flooding
  const now = Date.now();
  if (now - lastInteractionTime < 5000) return; // Throttle to 1 event per 5 seconds

  lastInteractionTime = now;
  lastMousePosition = { x: event.clientX, y: event.clientY };

  const mouseEvent = {
    type: 'mousemove',
    timestamp: now,
    x: event.clientX,
    y: event.clientY,
    pageX: event.pageX,
    pageY: event.pageY,
    target: getElementInfo(event.target)
  };

  recordEvent(mouseEvent);
}

function handleClick(event) {
  if (!recording || !settings.mouse) return;
  
  const target = event.target;
  lastClickedElement = target;
  
  const clickEvent = {
    type: 'click',
    x: event.clientX,
    y: event.clientY,
    pageX: event.pageX,
    pageY: event.pageY,
    button: event.button,
    target: getElementInfo(target)
  };
  
  recordEvent(clickEvent);
}

function handleInput(event) {
  if (!recording || !settings.keyboard) return;

  // console.log('[Action Tracker] Input event captured');

  const inputEvent = {
    type: 'input',
    timestamp: Date.now(),
    target: getElementInfo(event.target),
    value: getInputValue(event.target),
    xpath: getXPath(event.target),
    selector: getCssSelector(event.target)
  };

  recordEvent(inputEvent);

  // Force save events after input
  setTimeout(saveEvents, 1000);
}

function handleContextMenu(event) {
  const contextMenuEvent = {
    type: 'contextMenu',
    timestamp: Date.now(),
    position: {
      clientX: event.clientX,
      clientY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY
    },
    target: getElementInfo(event.target)
  };

  recordEvent(contextMenuEvent);
}

function handleMouseDown(event) {
  const mouseDownEvent = {
    type: 'mouseDown',
    timestamp: Date.now(),
    position: {
      clientX: event.clientX,
      clientY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY
    },
    button: event.button,
    target: getElementInfo(event.target)
  };

  recordEvent(mouseDownEvent);
}

function handleMouseUp(event) {
  const mouseUpEvent = {
    type: 'mouseUp',
    timestamp: Date.now(),
    position: {
      clientX: event.clientX,
      clientY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY
    },
    button: event.button,
    target: getElementInfo(event.target)
  };

  recordEvent(mouseUpEvent);
}

function handleWheel(event) {
  // Throttle wheel events
  const now = Date.now();
  if (now - lastInteractionTime < 100) return; // 100ms throttle
  lastInteractionTime = now;

  const wheelEvent = {
    type: 'wheel',
    timestamp: now,
    deltaX: event.deltaX,
    deltaY: event.deltaY,
    deltaMode: event.deltaMode
  };

  recordEvent(wheelEvent);
}

function handleKeyDown(event) {
  if (!recording || !settings.keyboard) return;
  
  // Don't record actual key values for password fields
  const isPassword = event.target.type === 'password';
  
  const keyEvent = {
    type: 'keydown',
    key: isPassword ? '[MASKED]' : event.key,
    code: isPassword ? '[MASKED]' : event.code,
    target: getElementInfo(event.target)
  };
  
  recordEvent(keyEvent);
}

function handleKeyUp(event) {
  if (!recording || !settings.keyboard) return;
  
  // Don't record actual key values for password fields
  const isPassword = event.target.type === 'password';
  
  const keyEvent = {
    type: 'keyup',
    key: isPassword ? '[MASKED]' : event.key,
    code: isPassword ? '[MASKED]' : event.code,
    target: getElementInfo(event.target)
  };
  
  recordEvent(keyEvent);
}

function handleScroll(event) {
  // Throttle scroll events
  const now = Date.now();
  if (now - lastInteractionTime < 100) return; // 100ms throttle
  lastInteractionTime = now;

  const scrollEvent = {
    type: 'scroll',
    timestamp: now,
    position: {
      scrollX: window.scrollX,
      scrollY: window.scrollY
    },
    target: event.target === document ? 'document' : getElementInfo(event.target)
  };

  recordEvent(scrollEvent);
}

function handleVisibilityChange() {
  const visibilityEvent = {
    type: 'visibilityChange',
    timestamp: Date.now(),
    visible: !document.hidden
  };

  recordEvent(visibilityEvent);
}

function handleWindowFocus() {
  const focusEvent = {
    type: 'windowFocus',
    timestamp: Date.now()
  };

  recordEvent(focusEvent);
}

function handleWindowBlur() {
  const blurEvent = {
    type: 'windowBlur',
    timestamp: Date.now()
  };

  recordEvent(blurEvent);
}

function handleWindowResize() {
  // Throttle resize events
  const now = Date.now();
  if (now - lastInteractionTime < 200) return; // 200ms throttle
  lastInteractionTime = now;

  const resizeEvent = {
    type: 'windowResize',
    timestamp: now,
    size: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };

  recordEvent(resizeEvent);
}

// Record an event
function recordEvent(eventData) {
  if (!recording || !sessionId) {
    return;
  }

  // Add common properties
  eventData.timestamp = Date.now();
  eventData.url = window.location.href;
  eventData.title = document.title;

  // Add to events array
  events.push(eventData);
  
  // Log the event (for debugging)
  // console.log('[Action Tracker] Recorded event:', eventData);

  // Update last interaction time
  lastInteractionTime = Date.now();

  // Send events to background script periodically
  if (events.length >= 10) {
    saveEvents();
  }
}

// Override console methods to capture logs
function overrideConsoleMethods() {
  const originalMethods = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };

  // Store original methods for restoration later
  window._actionTrackerOriginalConsoleMethods = originalMethods;

  // Override each method
  Object.keys(originalMethods).forEach(method => {
    console[method] = function () {
      // Call original method
      originalMethods[method].apply(console, arguments);

      // Record console event
      try {
        const args = Array.from(arguments).map(arg => {
          try {
            return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
          } catch (e) {
            return '[Object]';
          }
        });

        const consoleEvent = {
          type: 'console',
          timestamp: Date.now(),
          method: method,
          args: args
        };

        consoleLogsBuffer.push(consoleEvent);

        // Periodically flush console logs
        if (consoleLogsBuffer.length >= 10) {
          flushConsoleLogs();
        }
      } catch (e) {
        // Ignore errors in console logging
      }
    };
  });
}

// Restore original console methods
function restoreConsoleMethods() {
  if (window._actionTrackerOriginalConsoleMethods) {
    Object.keys(window._actionTrackerOriginalConsoleMethods).forEach(method => {
      console[method] = window._actionTrackerOriginalConsoleMethods[method];
    });

    delete window._actionTrackerOriginalConsoleMethods;

    // Flush any remaining logs
    flushConsoleLogs();
  }
}

// Flush console logs
function flushConsoleLogs() {
  if (consoleLogsBuffer.length > 0) {
    const logs = [...consoleLogsBuffer];
    consoleLogsBuffer = [];

    logs.forEach(log => {
      recordEvent(log);
    });
  }
}

// Save events to background script
function saveEvents() {
  if (!recording || !sessionId || events.length === 0) return;

  const eventsToSave = [...events];
  events = [];

  // console.log(`[Action Tracker] Saving ${eventsToSave.length} events to background script`);

  // Use a more reliable approach with retries
  const sendEventsWithRetry = (retryCount = 0) => {
    const maxRetries = 3;

    if (!extensionContextValid) {
      // console.warn('[Action Tracker] Not saving events, extension context invalidated');
      return;
    }

    try {
      safeChromeRuntimeSendMessage({
        action: 'saveEvent',
        sessionId: sessionId,
        eventData: eventsToSave
      }, response => {
        if (!response) {
          // console.error('[Action Tracker] Error sending events or extension context invalidated');

          // Retry logic
          if (retryCount < maxRetries && extensionContextValid) {
            // console.log(`[Action Tracker] Retrying event send (attempt ${retryCount + 1}/${maxRetries})...`);
            setTimeout(() => sendEventsWithRetry(retryCount + 1), 500 * Math.pow(2, retryCount));
          } else if (extensionContextValid) {
            // console.error('[Action Tracker] Max retries reached, putting events back in queue');
            // Put events back in the queue if max retries reached
            events = eventsToSave.concat(events);
          }
        } else if (response.success) {
          // console.log(`[Action Tracker] Successfully sent ${eventsToSave.length} events`);
        } else {
          // console.error('[Action Tracker] Background script returned error:', response);
          // Put events back in the queue
          if (extensionContextValid) {
            events = eventsToSave.concat(events);
          }
        }
      });
    } catch (e) {
      // console.error('[Action Tracker] Exception sending events:', e);

      // Retry logic for exceptions
      if (retryCount < maxRetries && extensionContextValid) {
        // console.log(`[Action Tracker] Retrying after exception (attempt ${retryCount + 1}/${maxRetries})...`);
        setTimeout(() => sendEventsWithRetry(retryCount + 1), 500 * Math.pow(2, retryCount));
      } else if (extensionContextValid) {
        // Put events back in the queue if max retries reached
        events = eventsToSave.concat(events);
      }
    }
  };

  // Start the send process
  sendEventsWithRetry();
}

// Add screenshot capability
function captureScreenshot(selector) {
  return new Promise((resolve, reject) => {
    try {
      const element = document.querySelector(selector);
      if (!element) {
        reject(new Error('Element not found'));
        return;
      }

      html2canvas(element).then(canvas => {
        const imageData = canvas.toDataURL('image/png');
        resolve(imageData);
      }).catch(error => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Helper functions
function getElementInfo(element) {
  if (!element || element === document) return { type: 'document' };

  try {
    const rect = element.getBoundingClientRect();

    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || null,
      className: element.className || null,
      type: element.type || null,
      name: element.name || null,
      value: element.type === 'password' ? '[REDACTED]' : getInputValue(element),
      href: element.href || null,
      src: element.src || null,
      alt: element.alt || null,
      title: element.title || null,
      textContent: getElementText(element),
      attributes: getElementAttributes(element),
      position: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      },
      xpath: getXPath(element),
      cssSelector: getCssSelector(element)
    };
  } catch (error) {
    return { error: 'Failed to get element info' };
  }
}

function getElementText(element) {
  if (!element) return null;

  // For input elements, return their value
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    return element.type === 'password' ? '[REDACTED]' : element.value;
  }

  // For other elements, return trimmed text content
  const text = element.textContent || '';
  return text.trim().substring(0, 100); // Limit length
}

function getInputValue(element) {
  if (!element) return null;

  // Handle different input types
  if (element.tagName === 'INPUT') {
    if (element.type === 'checkbox' || element.type === 'radio') {
      return element.checked;
    } else if (element.type === 'password') {
      return '[REDACTED]';
    } else {
      return element.value;
    }
  } else if (element.tagName === 'TEXTAREA') {
    return element.value;
  } else if (element.tagName === 'SELECT') {
    return element.value;
  }

  return null;
}

function getElementAttributes(element) {
  if (!element || !element.attributes) return {};

  const attributes = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    // Skip password values
    if (attr.name === 'value' && element.type === 'password') {
      attributes[attr.name] = '[REDACTED]';
    } else {
      attributes[attr.name] = attr.value;
    }
  }

  return attributes;
}

function getXPath(element) {
  if (!element) return '';

  // Special case for document
  if (element === document) return '/';

  let path = '';
  let current = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1;
    let sibling = current.previousSibling;

    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === current.tagName) {
        index++;
      }
      sibling = sibling.previousSibling;
    }

    const tagName = current.tagName.toLowerCase();
    const pathSegment = index > 1 ? `${tagName}[${index}]` : tagName;

    path = `/${pathSegment}${path}`;
    current = current.parentNode;
  }

  return path || '/';
}

function getCssSelector(element) {
  if (!element || element === document) return '';

  // Try to get a unique selector with ID if available
  if (element.id) {
    return `#${element.id}`;
  }

  // Build a selector with classes
  let selector = element.tagName.toLowerCase();
  if (element.className) {
    const classes = element.className.split(' ').filter(c => c.trim());
    if (classes.length > 0) {
      selector += `.${classes.join('.')}`;
    }
  }

  // If the selector might not be unique, add parent context
  try {
    if (document.querySelectorAll(selector).length > 1 && element.parentElement) {
      return `${getCssSelector(element.parentElement)} > ${selector}`;
    }
  } catch (e) {
    // Invalid selector, continue with basic approach
  }

  return selector;
}
