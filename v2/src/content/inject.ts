import { record } from "rrweb";
import type { recordOptions } from "rrweb";
import type { eventWithTime } from "@rrweb/types";
import { MessageName, type RecordStartedMessage } from "~/types";
import type { NetworkRequest, EnvironmentMetadata } from "~/types";
import { CustomEventType } from "~/types";
import { isInCrossOriginIFrame } from "~/utils";
import { getRecordConsolePlugin } from "@rrweb/rrweb-plugin-console-record";

/**
 * This script is injected into both main page and cross-origin IFrames through <script> tags.
 */

let stopFn: (() => void) | null = null;
let networkRequests: NetworkRequest[] = [];
let emitEvent: ((event: eventWithTime) => void) | null = null;

declare global {
  interface XMLHttpRequest {
    _networkRequest?: NetworkRequest;
  }
}

function createCustomEvent(type: CustomEventType, data: any): eventWithTime {
  return {
    type: 5, // Custom event type in rrweb
    data: {
      tag: "custom",
      payload: {
        type,
        data,
      },
    },
    timestamp: Date.now(),
  };
}

function setupNetworkTracking() {
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const startTime = Date.now();
    const urlArg = args[0];
    const url =
      typeof urlArg === "string"
        ? urlArg
        : urlArg instanceof URL
        ? urlArg.toString()
        : urlArg.url;
    const method = args[1]?.method || "GET";

    const request: NetworkRequest = {
      type: "fetch",
      url: url as string,
      method,
      startTime,
      status: "pending",
    };

    networkRequests.push(request);

    try {
      const response = await originalFetch.apply(this, args);
      request.endTime = Date.now();
      request.duration = request.endTime - request.startTime;
      request.status = response.status;
      request.statusText = response.statusText;

      if (emitEvent) {
        emitEvent(createCustomEvent(CustomEventType.Network, request));
      }
      return response;
    } catch (error: unknown) {
      request.endTime = Date.now();
      request.duration = request.endTime - request.startTime;
      request.status = "error";
      request.error = error instanceof Error ? error.message : String(error);

      if (emitEvent) {
        emitEvent(createCustomEvent(CustomEventType.Network, request));
      }

      throw error;
    }
  };

  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async: boolean = true,
    username?: string | null,
    password?: string | null
  ) {
    this._networkRequest = {
      type: "xhr",
      method,
      url: url.toString(),
      startTime: Date.now(),
      status: "pending",
    };
    networkRequests.push(this._networkRequest);
    return originalXhrOpen.call(
      this,
      method,
      url,
      async,
      username || null,
      password || null
    );
  };

  XMLHttpRequest.prototype.send = function (
    body?: Document | XMLHttpRequestBodyInit | null
  ) {
    if (this._networkRequest) {
      const request = this._networkRequest;

      this.addEventListener("load", function () {
        request.endTime = Date.now();
        request.duration = request.endTime - request.startTime;
        request.status = this.status;
        request.statusText = this.statusText;

        if (emitEvent) {
          emitEvent(createCustomEvent(CustomEventType.Network, request));
        }
      });

      this.addEventListener("error", function () {
        request.endTime = Date.now();
        request.duration = request.endTime - request.startTime;
        request.status = "error";

        if (emitEvent) {
          emitEvent(createCustomEvent(CustomEventType.Network, request));
        }
      });
    }

    return originalXhrSend.call(this, body);
  };
}

function setupKeyboardTracking() {
  let currentInputElement: HTMLElement | null = null;
  let currentInputValue = "";
  let inputChangeTimeout: number | null = null;

  // Track focus on input elements
  document.addEventListener("focusin", (event) => {
    const target = event.target as HTMLElement;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    ) {
      currentInputElement = target;
      currentInputValue =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
          ? target.value
          : target.textContent || "";
    }
  });

  // Track input changes while typing
  document.addEventListener("input", (event) => {
    const target = event.target as HTMLElement;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    ) {
      // Clear any existing timeout to debounce rapid changes
      if (inputChangeTimeout !== null) {
        window.clearTimeout(inputChangeTimeout);
      }

      // Set a new timeout to capture the input after a brief pause in typing
      inputChangeTimeout = window.setTimeout(() => {
        const newValue =
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement
            ? target.value
            : target.textContent || "";

        // Only emit if value is not empty
        if (newValue.trim()) {
          if (emitEvent) {
            emitEvent(
              createCustomEvent(CustomEventType.InputChange, {
                value: newValue,
                element: getElementPath(target),
                timestamp: Date.now(),
              })
            );
          }
        }
        inputChangeTimeout = null;
      }, 500); // 500ms debounce
    }
  });

  // Also track when focus leaves the input
  document.addEventListener("focusout", (event) => {
    const target = event.target as HTMLElement;
    if (target === currentInputElement) {
      // Clear any pending timeout
      if (inputChangeTimeout !== null) {
        window.clearTimeout(inputChangeTimeout);
        inputChangeTimeout = null;
      }

      const newValue =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
          ? target.value
          : target.textContent || "";

      // Only emit if value changed and not empty
      if (newValue !== currentInputValue && newValue.trim()) {
        if (emitEvent) {
          emitEvent(
            createCustomEvent(CustomEventType.InputChange, {
              value: newValue,
              element: getElementPath(target),
              timestamp: Date.now(),
            })
          );
        }
      }

      currentInputElement = null;
      currentInputValue = "";
    }
  });

  document.addEventListener("keydown", (event) => {
    if (["Control", "Alt", "Shift", "Meta"].includes(event.key)) {
      return;
    }

    const isInputField =
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target instanceof HTMLElement && event.target.isContentEditable);

    // We don't track individual keystrokes in input fields anymore
    if (isInputField) {
      return;
    }

    if (emitEvent) {
      emitEvent(
        createCustomEvent(CustomEventType.Keypress, {
          key: event.key,
          timestamp: Date.now(),
          target: getElementPath(event.target as HTMLElement),
          isMetaKey:
            event.ctrlKey || event.altKey || event.shiftKey || event.metaKey,
        })
      );
    }
  });
}

function setupEnhancedMouseTracking() {
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;

    if (emitEvent) {
      // Capture DOM snapshot on each click
      const domSnapshot = captureDOMSnapshot();

      emitEvent(
        createCustomEvent(CustomEventType.MouseClick, {
          x: event.clientX,
          y: event.clientY,
          target: getElementPath(target),
          timestamp: Date.now(),
          button: event.button,
          domSnapshot: domSnapshot,
        })
      );
    }
  });
}

// Helper function to get meaningful element description
function getElementDescription(element: HTMLElement): string {
  // For buttons or clickable elements
  if (
    element.tagName === "BUTTON" ||
    element.tagName === "A" ||
    element.getAttribute("role") === "button"
  ) {
    // Try to get text content
    const text = element.textContent?.trim();
    if (text && text.length > 0) {
      return `"${text}" button`;
    }

    // Try to get aria-label
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) {
      return `"${ariaLabel}" button`;
    }

    // Try to get value for input buttons
    if (
      element.tagName === "INPUT" &&
      (element as HTMLInputElement).type === "button"
    ) {
      const value = (element as HTMLInputElement).value;
      if (value) {
        return `"${value}" button`;
      }
    }
  }

  // For input fields
  if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
    const inputElement = element as HTMLInputElement | HTMLTextAreaElement;

    // Try to find associated label
    let labelText = "";
    if (inputElement.id) {
      const label = document.querySelector(`label[for="${inputElement.id}"]`);
      if (label) {
        labelText = label.textContent?.trim() || "";
      }
    }

    // Try placeholder if no label
    if (!labelText) {
      labelText = inputElement.placeholder || "";
    }

    // Try aria-label if no placeholder
    if (!labelText) {
      labelText = inputElement.getAttribute("aria-label") || "";
    }

    // Use input type if nothing else
    if (labelText) {
      return `"${labelText}" input field`;
    } else {
      return `${inputElement.type || "text"} input field`;
    }
  }

  // For select elements
  if (element.tagName === "SELECT") {
    const selectElement = element as HTMLSelectElement;

    // Try to find associated label
    let labelText = "";
    if (selectElement.id) {
      const label = document.querySelector(`label[for="${selectElement.id}"]`);
      if (label) {
        labelText = label.textContent?.trim() || "";
      }
    }

    if (labelText) {
      return `"${labelText}" dropdown`;
    } else {
      return "dropdown";
    }
  }

  // Default fallback
  return `${element.tagName.toLowerCase()}`;
}

// Helper function to get element path for better identification
function getElementPath(element: HTMLElement): string {
  let path = getElementDescription(element);

  // Add parent context if needed
  let parent = element.parentElement;
  let depth = 0;
  const maxDepth = 3; // Limit how far up we go

  while (parent && depth < maxDepth) {
    if (parent.id) {
      path += ` in #${parent.id}`;
      break;
    } else if (
      parent.className &&
      typeof parent.className === "string" &&
      parent.className.trim()
    ) {
      // Only use class if it's meaningful (not auto-generated)
      const classes = parent.className
        .split(" ")
        .filter((c) => c.length > 3 && !c.match(/^[a-z0-9]{8,}$/i)); // Skip likely auto-generated classes

      if (classes.length > 0) {
        path += ` in .${classes[0]}`;
        break;
      }
    } else if (
      parent.tagName === "FORM" ||
      parent.tagName === "NAV" ||
      parent.tagName === "HEADER" ||
      parent.tagName === "FOOTER" ||
      parent.tagName === "MAIN" ||
      parent.tagName === "SECTION"
    ) {
      path += ` in ${parent.tagName.toLowerCase()}`;
      break;
    }

    parent = parent.parentElement;
    depth++;
  }

  return path;
}

// Function to capture DOM snapshot
function captureDOMSnapshot(): any {
  // Create a simplified DOM representation
  function processNode(node: Element): any {
    // Skip invisible elements
    const style = window.getComputedStyle(node);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0"
    ) {
      return null;
    }

    const rect = node.getBoundingClientRect();
    // Skip elements with no dimensions
    if (rect.width === 0 || rect.height === 0) {
      return null;
    }

    const result: any = {
      tagName: node.tagName.toLowerCase(),
      id: node.id || undefined,
      className:
        typeof node.className === "string" ? node.className : undefined,
      text: node.textContent?.trim() || undefined,
      attributes: {},
      children: [],
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
    };

    // Add relevant attributes
    [
      "type",
      "placeholder",
      "value",
      "href",
      "src",
      "alt",
      "title",
      "aria-label",
      "role",
    ].forEach((attr) => {
      const value = node.getAttribute(attr);
      if (value) {
        result.attributes[attr] = value;
      }
    });

    // Process children
    Array.from(node.children).forEach((child) => {
      const childResult = processNode(child as Element);
      if (childResult) {
        result.children.push(childResult);
      }
    });

    return result;
  }

  // Start from body
  return processNode(document.body);
}

function captureEnvironmentMetadata() {
  const metadata: EnvironmentMetadata = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    timestamp: Date.now(),
  };

  if (emitEvent) {
    emitEvent(createCustomEvent(CustomEventType.Metadata, metadata));
  }
}

function startRecord(config: recordOptions<eventWithTime>) {
  emitEvent = (event: eventWithTime) => {
    postMessage({
      message: MessageName.EmitEvent,
      event,
    });
  };

  setupNetworkTracking();
  setupKeyboardTracking();
  setupEnhancedMouseTracking();

  // Capture initial DOM snapshot
  const initialDomSnapshot = captureDOMSnapshot();
  if (emitEvent) {
    emitEvent(
      createCustomEvent(CustomEventType.DOMSnapshot, {
        snapshot: initialDomSnapshot,
        url: window.location.href,
        timestamp: Date.now(),
      })
    );
  }

  captureEnvironmentMetadata();

  stopFn =
    record({
      emit: emitEvent,
      plugins: [
        getRecordConsolePlugin({
          level: ["info", "log", "warn", "error"],
          lengthThreshold: 2000,
          stringifyOptions: {
            stringLengthLimit: 1000,
            numOfKeysLimit: 100,
            depthOfLimit: 2,
          },
        }),
      ],
      ...config,
    }) || null;

  postMessage({
    message: MessageName.RecordStarted,
    startTimestamp: Date.now(),
  } as RecordStartedMessage);
}

const messageHandler = (
  event: MessageEvent<{
    message: MessageName;
    config?: recordOptions<eventWithTime>;
  }>
) => {
  if (event.source !== window) return;
  const data = event.data;
  const eventHandler = {
    [MessageName.StartRecord]: () => {
      startRecord(data.config || {});
    },
    [MessageName.StopRecord]: () => {
      if (stopFn) {
        try {
          stopFn();
        } catch (e) {
          //
        }
      }
      postMessage({
        message: MessageName.RecordStopped,
        endTimestamp: Date.now(),
      });
      window.removeEventListener("message", messageHandler);
    },
  } as Record<MessageName, () => void>;
  if (eventHandler[data.message]) eventHandler[data.message]();
};

function postMessage(message: unknown) {
  if (!isInCrossOriginIFrame()) window.postMessage(message, location.origin);
}

window.addEventListener("message", messageHandler);

window.postMessage(
  {
    message: MessageName.RecordScriptReady,
  },
  location.origin
);
