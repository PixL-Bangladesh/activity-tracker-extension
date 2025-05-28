import type { ReactNode } from "react";
import type {
  mouseInteractionData,
  inputData,
  scrollData,
  viewportResizeData,
  MouseInteractions,
  eventWithTime,
} from "@rrweb/types";
import type { SessionAnalysis } from "./session-analyzer";

export interface EventWithScreenshots {
  id: string;
  relativeTime: number;
  type:
    | "network"
    | "mouseClick"
    | "keypress"
    | "input"
    | "scroll"
    | "resize"
    | "consoleLog";
  timestamp: number;
  beforeScreenshot: string | null;
  afterScreenshot: string | null;
  // Use more specific types based on the EventType
  data:
    | MouseClickData
    | KeypressData
    | InputData
    | ScrollData
    | ResizeData
    | NetworkData
    | ConsoleData;
}

// Specific data types for different events
export interface MouseClickData extends Partial<mouseInteractionData> {
  id: number;
  x: number;
  y: number;
  type: MouseInteractions; // Use the proper enum from RRWeb
  timestamp: number;
  target?: string; // Element target description
  pointerType?: string; // Mouse, touch, pen
  elementType?: string; // What type of element was clicked
  href?: string; // If the click was on a link
}

export interface KeypressData {
  key?: string;
  code?: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  target?: string;
  timestamp: number;
  elementType?: string; // What type of element was the target
}

export interface InputData extends Partial<inputData> {
  id: number;
  value: string;
  isChecked?: boolean;
  userTriggered?: boolean;
  timestamp: number;
  elementType?: string;
  fieldName?: string; // For form inputs, the name of the field
}

export interface ScrollData extends Partial<scrollData> {
  id: number;
  x: number;
  y: number;
  timestamp: number;
  target?: string; // Which element was scrolled
}

export interface ResizeData extends Partial<viewportResizeData> {
  width: number;
  height: number;
  timestamp: number;
}

export interface NetworkData {
  url: string;
  method: string;
  status?: number;
  type?: string;
  initiator?: string;
  duration?: number;
  size?: number;
  timestamp: number;
  responseType?: string;
  contentType?: string;
}

export interface ConsoleData {
  level: "log" | "info" | "warn" | "error" | "debug";
  message: string;
  timestamp: number;
  trace?: string;
}

// Interface for timeline events
export interface TimelineEvent {
  id: string;
  timestamp: number;
  relativeTime: number;
  type:
    | "network"
    | "mouseClick"
    | "keypress"
    | "input"
    | "scroll"
    | "resize"
    | "consoleLog"
    | "metadata"
    | "mutation";
  description: string;
  details: any;
  icon: ReactNode;
  userAnnotation?: string; // User's explanation of what they were trying to do
  inputValue?: string;
  parentElement?: string;
  href?: string;
}

export interface TimelineData {
  events: TimelineEvent[];
  sessionStartTime: number;
  sessionEndTime: number;
  sessionDuration: number;
  interactionsByType: {
    mouseClicks: number;
    keypresses: number;
    scrolls: number;
    inputs: number;
    resizes: number;
    networkRequests: number;
    mutations: number;
  };
  segmentData?: {
    segments: TimelineSegment[];
    idlePeriods: IdlePeriod[];
  };
}

export interface TimelineSegment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  startEvent?: TimelineEvent;
  endEvent?: TimelineEvent;
  events: TimelineEvent[];
  type: "active" | "idle" | "form-filling" | "browsing" | "reading";
  description?: string;
}

export interface IdlePeriod {
  startTime: number;
  endTime: number;
  duration: number;
}

// Interface for LLM training data
export interface LLMTrainingData {
  sessionId: string;
  sessionName: string;
  sessionDuration: number;
  startTime: number;
  events: {
    timestamp: number;
    relativeTime: number; // milliseconds from start
    type: string;
    details: any;
    context?: string;
    userAnnotation?: string; // User's explanation
    inputValue?: string;
    parentElement?: string;
    href?: string;
    targetId?: number;
    targetElement?: string;
  }[];
  metadata?: any;
  analytics?: {
    interactionPatterns: any[];
    navigationFlow: any[];
    focusAreas: any[];
    timingMetrics: any;
    elementInteractions: any[];
  };
  sessionAnalysis?: Partial<SessionAnalysis>;
}

// Interface for advanced analytics
export interface AdvancedAnalytics {
  interactionPatterns: {
    pattern: string;
    count: number;
    averageTimeBetween: number;
  }[];
  navigationFlow: {
    from: string;
    to: string;
    count: number;
  }[];
  focusAreas: {
    element: string;
    timeSpent: number;
    interactionCount: number;
  }[];
  timingMetrics: {
    averageTimeBetweenClicks: number;
    averageTimeBetweenKeypresses: number;
    totalIdleTime: number;
    totalActiveTime: number;
  };
  elementInteractions: {
    element: string;
    interactionType: string;
    count: number;
  }[];
}

export type Session = {
  id: string;
  name: string;
  tags: string[];
  createTimestamp: number;
  modifyTimestamp: number;
  recorderVersion: string;
};
