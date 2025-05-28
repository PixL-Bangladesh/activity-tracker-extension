import {
  MediaInteractions,
  type incrementalData,
  type inputData,
  type mediaInteractionData,
  type mouseInteractionData,
  type mousemoveData,
  type selectionData,
} from "@rrweb/types";
import {
  EventType,
  IncrementalSource,
  MouseInteractions,
  type eventWithTime,
} from "rrweb";

export interface AIAgentTrainingData {
  task_examples: TaskExample[];
  website_structures: WebsiteStructure[];
  language_examples: LanguageExample[];
}

export interface TaskExample {
  task_id: string;
  task_type:
    | "ordering"
    | "scheduling"
    | "booking"
    | "searching"
    | "form_filling"
    | string;
  description: string;
  website: string;
  steps: Step[];
  dom_snapshots: Record<string, DOMSnapshot>;
  expected_outcome: ExpectedOutcome;
  error_cases: ErrorCase[];
  user_preferences?: Record<string, any>;
}

export interface Step {
  step_id: number;
  action:
    | "navigate"
    | "click"
    | "fill"
    | "select"
    | "hover"
    | "scroll"
    | "wait"
    | string;
  element_type:
    | "url"
    | "button"
    | "input"
    | "select"
    | "checkbox"
    | "radio"
    | "link"
    | string;
  element_id?: string;
  selector?: string;
  value?: string;
  timestamp: {
    relative_ms: number; // milliseconds from start of task
    expected_duration_ms?: number; // expected duration of this step
    max_wait_ms?: number; // maximum time to wait for element
  };
  element_state?: ElementState;
  page_context?: PageContext;
  surrounding_elements?: SurroundingElement[];
}

export interface ElementState {
  visible: boolean;
  enabled: boolean;
  text?: string;
  placeholder?: string;
  required?: boolean;
  checked?: boolean;
  selected?: boolean;
  validation_pattern?: string;
  position?: { x: number; y: number };
  dimensions?: { width: number; height: number };
  attributes?: Record<string, string>;
  css_properties?: Record<string, string>;
}

export interface PageContext {
  url: string;
  title: string;
  viewport_size?: { width: number; height: number };
  scroll_position?: { x: number; y: number };
  loaded_resources?: string[];
}

export interface SurroundingElement {
  relation: "parent" | "child" | "sibling" | "ancestor" | "descendant";
  tag: string;
  id?: string;
  class?: string;
  text?: string;
  selector?: string;
}

export interface DOMSnapshot {
  relevant_dom_section: string;
  timestamp: number; // Unix timestamp
}

export interface ExpectedOutcome {
  url_pattern?: string;
  success_indicators: {
    element: string;
    exists?: boolean;
    contains_text?: string;
    attribute?: { name: string; value: string };
  }[];
  completion_time_range?: { min_ms: number; max_ms: number };
}

export interface ErrorCase {
  error_type: string;
  detection: {
    element?: string;
    contains_text?: string;
    status_code?: number;
    timeout_ms?: number;
    error_message?: string;
  };
  resolution: string;
  fallback_steps?: Step[];
}

export interface WebsiteStructure {
  website: string;
  common_elements: {
    name: string;
    selector: string;
    fields?: string[];
    interaction?: string;
  }[];
  navigation_map: Record<string, string>;
  authentication_flow?: AuthenticationFlow;
  rate_limits?: RateLimits;
}

export interface AuthenticationFlow {
  login_url: string;
  login_selectors: {
    username: string;
    password: string;
    submit: string;
    two_factor?: string;
  };
  session_indicators: {
    element: string;
    contains_text?: string;
  }[];
  logout_url?: string;
}

export interface RateLimits {
  max_requests_per_minute?: number;
  session_timeout_seconds?: number;
  captcha_indicators?: string[];
}

export interface LanguageExample {
  natural_language: string;
  parsed_intent: {
    action: string;
    [key: string]: any;
  };
  variations?: string[];
  context?: string;
}

///
export function extractStructuredData(events: eventWithTime[]) {
  // Initialize your structured data format
  const structuredData: AIAgentTrainingData = {
    task_examples: [],
    website_structures: [],
    language_examples: [],
  };

  // Track the current task being built
  let currentTask: Partial<TaskExample> | null = null;
  let currentStepId = 0;
  let taskStartTime: number | null = null;
  let currentUrl = "";

  // Process each event in chronological order
  // biome-ignore lint/complexity/noForEach: <explanation>
  events.forEach((event) => {
    // Initialize task on the first event if not already done
    if (!currentTask) {
      currentTask = {
        task_id: `task_${Date.now()}`,
        task_type: "web_interaction",
        description: "Web interaction session",
        website: extractDomain(currentUrl),
        steps: [],
        dom_snapshots: {},
        expected_outcome: {
          success_indicators: [],
        },
        error_cases: [],
      };
      taskStartTime = event.timestamp;
    }

    // Update URL from meta events
    if (event.type === EventType.Meta) {
      const metaData = event.data as {
        href: string;
        width: number;
        height: number;
      };
      currentUrl = metaData.href;
      if (currentTask) {
        currentTask.website = extractDomain(currentUrl);
      }
    }

    // Process incremental snapshots for the specified event types
    if (
      event.type === EventType.IncrementalSnapshot &&
      currentTask &&
      taskStartTime
    ) {
      const incrementalData = event.data as incrementalData;
      const relativeTime = event.timestamp - taskStartTime;

      switch (incrementalData.source) {
        case IncrementalSource.MouseInteraction: {
          const mouseData = incrementalData as mouseInteractionData;
          currentTask.steps?.push({
            step_id: currentStepId++,
            action: getMouseActionType(mouseData.type),
            element_type: "element",
            element_id: `element_${mouseData.id}`,
            selector: `#element_${mouseData.id}`, // Would need actual selector
            timestamp: {
              relative_ms: relativeTime,
              expected_duration_ms: 300,
            },
            element_state: {
              visible: true,
              enabled: true,
              position:
                mouseData.x !== undefined && mouseData.y !== undefined
                  ? { x: mouseData.x, y: mouseData.y }
                  : undefined,
            },
            page_context: {
              url: currentUrl,
              title: "Page Title", // Would need actual title
            },
          });
          break;
        }

        case IncrementalSource.Input: {
          const inputData = incrementalData as inputData;
          currentTask.steps?.push({
            step_id: currentStepId++,
            action: "fill",
            element_type: "input",
            element_id: `input_${inputData.id}`,
            selector: `#input_${inputData.id}`, // Would need actual selector
            value: inputData.text, // Storing input value as requested
            timestamp: {
              relative_ms: relativeTime,
              expected_duration_ms:
                500 * Math.max(1, inputData.text.length / 5), // Rough estimate
            },
            element_state: {
              visible: true,
              enabled: true,
              checked: inputData.isChecked,
              required: false, // Default
            },
            page_context: {
              url: currentUrl,
              title: "Page Title", // Would need actual title
            },
          });
          break;
        }

        case IncrementalSource.MediaInteraction: {
          const mediaData = incrementalData as mediaInteractionData;
          currentTask.steps?.push({
            step_id: currentStepId++,
            action: getMediaActionType(mediaData.type),
            element_type: "media",
            element_id: `media_${mediaData.id}`,
            selector: `#media_${mediaData.id}`, // Would need actual selector
            timestamp: {
              relative_ms: relativeTime,
              expected_duration_ms: 200,
            },
            element_state: {
              visible: true,
              enabled: true,
              attributes: {
                currentTime: mediaData.currentTime?.toString() as string,
                volume: mediaData.volume?.toString() as string,
                muted: mediaData.muted?.toString() as string,
                loop: mediaData.loop?.toString() as string,
                playbackRate: mediaData.playbackRate?.toString() as string,
              },
            },
            page_context: {
              url: currentUrl,
              title: "Page Title", // Would need actual title
            },
          });
          break;
        }

        case IncrementalSource.Drag: {
          const dragData = incrementalData as mousemoveData;
          if (dragData.positions.length > 0) {
            const firstPos = dragData.positions[0];
            const lastPos = dragData.positions[dragData.positions.length - 1];

            currentTask.steps?.push({
              step_id: currentStepId++,
              action: "drag",
              element_type: "element",
              element_id: `element_${firstPos.id}`,
              selector: `#element_${firstPos.id}`, // Would need actual selector
              timestamp: {
                relative_ms: relativeTime,
                expected_duration_ms: lastPos.timeOffset,
              },
              element_state: {
                visible: true,
                enabled: true,
                position: { x: firstPos.x, y: firstPos.y },
                attributes: {
                  endX: lastPos.x.toString(),
                  endY: lastPos.y.toString(),
                },
              },
              page_context: {
                url: currentUrl,
                title: "Page Title", // Would need actual title
              },
            });
          }
          break;
        }

        case IncrementalSource.Selection: {
          const selectionData = incrementalData as selectionData;
          currentTask.steps?.push({
            step_id: currentStepId++,
            action: "select",
            element_type: "text",
            timestamp: {
              relative_ms: relativeTime,
              expected_duration_ms: 300,
            },
            element_state: {
              visible: true,
              enabled: true,
              attributes: {
                selectionRanges: JSON.stringify(selectionData.ranges),
              },
            },
            page_context: {
              url: currentUrl,
              title: "Page Title", // Would need actual title
            },
          });
          break;
        }
      }
    }
  });

  // Finalize the current task if it exists
  if (
    currentTask &&
    (currentTask as unknown as TaskExample).steps &&
    (currentTask as unknown as TaskExample).steps.length > 0
  ) {
    structuredData.task_examples.push(currentTask as TaskExample);
  }

  return structuredData;
}

// Helper functions
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function getMouseActionType(type: MouseInteractions): string {
  switch (type) {
    case MouseInteractions.Click:
      return "click";
    case MouseInteractions.MouseDown:
      return "mousedown";
    case MouseInteractions.MouseUp:
      return "mouseup";
    case MouseInteractions.Focus:
      return "focus";
    case MouseInteractions.Blur:
      return "blur";
    case MouseInteractions.TouchStart:
      return "touchstart";
    case MouseInteractions.TouchEnd:
      return "touchend";
    case MouseInteractions.ContextMenu:
      return "contextmenu";
    case MouseInteractions.DblClick:
      return "dblclick";
    default:
      return "interact";
  }
}

function getMediaActionType(type: MediaInteractions): string {
  switch (type) {
    case MediaInteractions.Play:
      return "play";
    case MediaInteractions.Pause:
      return "pause";
    case MediaInteractions.Seeked:
      return "seek";
    case MediaInteractions.VolumeChange:
      return "volume_change";
    case MediaInteractions.RateChange:
      return "rate_change";
    default:
      return "media_interact";
  }
}
