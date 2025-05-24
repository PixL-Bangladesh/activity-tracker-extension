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
const networkRequests: NetworkRequest[] = [];
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

      this.addEventListener("error", () => {
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
  captureEnvironmentMetadata();

  stopFn =
    record({
      emit: emitEvent,
      sampling: {
        input: "last",
        mousemove: false,
        scroll: 2000,
      },
      plugins: [
        getRecordConsolePlugin({
          level: ["info", "log", "warn", "error"],
          lengthThreshold: 2000,
          stringifyOptions: {
            stringLengthLimit: 1000,
            numOfKeysLimit: 100,
            depthOfLimit: 2,
          },
          logger: window.console,
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
