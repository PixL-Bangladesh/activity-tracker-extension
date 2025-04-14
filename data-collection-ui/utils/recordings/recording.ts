// recording.ts - Main recording module

import type { eventWithTime } from "@rrweb/types";
import { record } from "rrweb";
import { getRecordConsolePlugin } from "@rrweb/rrweb-plugin-console-record";
import {
  type NetworkRequest,
  CustomEventType,
  type EnvironmentMetadata,
} from "./types";
import { pack } from "@rrweb/packer";

// State variables
let isRecording = false;
let stopFn: (() => void) | null = null;
let networkRequests: NetworkRequest[] = [];
let emitEventCallback: ((event: eventWithTime) => void) | null = null;
let sessionEvents: eventWithTime[] = [];

/**
 * Create a custom event with timestamp
 */

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
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

/**
 * Main function to start recording
 */
export function startRecording(
  options: {
    onEvent?: (event: eventWithTime) => void;
  } = {}
) {
  if (isRecording) return;

  sessionEvents = [];
  networkRequests = [];

  // Setup event handler
  emitEventCallback = (event: eventWithTime) => {
    // Store event
    sessionEvents.push(event);

    // Callback if provided
    if (options.onEvent) {
      options.onEvent(event);
    }
  };

  // Setup trackers
  setupNetworkTracking();

  // Capture environment metadata
  captureEnvironmentMetadata();
  console.log("Recording started, capturing environment metadata.");

  // Start rrweb recording
  stopFn =
    record({
      emit: emitEventCallback,
      recordCrossOriginIframes: true,
      sampling: {
        mousemove: false,
        input: "last",
      },
      plugins: [
        getRecordConsolePlugin({
          level: ["info", "log", "warn", "error"],
          lengthThreshold: 10000,
          stringifyOptions: {
            stringLengthLimit: 1000,
            numOfKeysLimit: 100,
            depthOfLimit: 1,
          },
          logger: window.console,
        }),
      ],
    }) || null;

  isRecording = true;
  return {
    startTimestamp: Date.now(),
  };
}

/**
 * Stop the recording and return collected events
 */
export function stopRecording() {
  if (!isRecording || !stopFn) return null;

  try {
    stopFn();
  } catch (e) {
    console.error("Error stopping recording:", e);
  }

  const events = [...sessionEvents];

  // Clear state
  stopFn = null;
  isRecording = false;
  emitEventCallback = null;
  sessionEvents = [];
  networkRequests = [];

  return {
    events,
    endTimestamp: Date.now(),
  };
}

/**
 * Check if recording is active
 */
export function isRecordingActive() {
  return isRecording;
}

/**
 * Setup network request tracking
 */
function setupNetworkTracking() {
  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const startTime = Date.now();
    const urlArg = args[0];
    const url =
      typeof urlArg === "string"
        ? urlArg
        : urlArg instanceof URL
        ? urlArg.toString()
        : (urlArg as Request).url;
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

      if (emitEventCallback) {
        emitEventCallback(createCustomEvent(CustomEventType.Network, request));
      }
      return response;
    } catch (error: unknown) {
      request.endTime = Date.now();
      request.duration = request.endTime - request.startTime;
      request.status = "error";
      request.error = error instanceof Error ? error.message : String(error);

      if (emitEventCallback) {
        emitEventCallback(createCustomEvent(CustomEventType.Network, request));
      }

      throw error;
    }
  };

  // Intercept XMLHttpRequest
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;

  // Define _networkRequest property for XMLHttpRequest
  Object.defineProperty(XMLHttpRequest.prototype, "_networkRequest", {
    value: undefined,
    writable: true,
    configurable: true,
  });

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async = true,
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
      async as boolean,
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

        if (emitEventCallback) {
          emitEventCallback(
            createCustomEvent(CustomEventType.Network, request)
          );
        }
      });

      this.addEventListener("error", () => {
        request.endTime = Date.now();
        request.duration = request.endTime - request.startTime;
        request.status = "error";

        if (emitEventCallback) {
          emitEventCallback(
            createCustomEvent(CustomEventType.Network, request)
          );
        }
      });
    }

    return originalXhrSend.call(this, body);
  };
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

  if (emitEventCallback) {
    emitEventCallback(createCustomEvent(CustomEventType.Metadata, metadata));
  }
}
