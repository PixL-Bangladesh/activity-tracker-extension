// Types for our custom events
export enum CustomEventType {
  Network = "network",
  Keypress = "keypress",
  MouseClick = "mouseClick",
  InputChange = "inputChange",
  DOMSnapshot = "domSnapshot",
  Metadata = "metadata",
}

export interface NetworkRequest {
  type: "fetch" | "xhr";
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: number | string;
  statusText?: string;
  error?: string;
}

export interface EnvironmentMetadata {
  userAgent: string;
  language: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  windowWidth: number;
  windowHeight: number;
  devicePixelRatio: number;
  timestamp: number;
}

declare global {
  interface XMLHttpRequest {
    _networkRequest?: NetworkRequest;
  }
}
