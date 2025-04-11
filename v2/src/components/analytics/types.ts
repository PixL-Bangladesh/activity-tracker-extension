import type { ReactNode } from 'react';

export interface EventWithScreenshots {
  id: string;
  relativeTime: number;
  type: "network" | "mouseClick" | "keypress" | "consoleLog";
  timestamp: number;
  beforeScreenshot: string | null;
  afterScreenshot: string | null;
  data: any;
}

// Interface for timeline events
export interface TimelineEvent {
  id: string;
  timestamp: number;
  relativeTime: number;
  type: "network" | "mouseClick" | "keypress" | "consoleLog";
  description: string;
  details: any;
  icon: ReactNode;
  userAnnotation?: string; // User's explanation of what they were trying to do
  inputValue?: string;
  parentElement?: string;
  href?: string;
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
  }[];
  metadata?: any;
  analytics?: {
    interactionPatterns: any[];
    navigationFlow: any[];
    focusAreas: any[];
    timingMetrics: any;
    elementInteractions: any[];
  };
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