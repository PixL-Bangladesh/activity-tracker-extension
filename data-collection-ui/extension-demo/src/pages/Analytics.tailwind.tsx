import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { Session } from "~/types";
import { getSession, getEvents } from "~/utils/storage";
import { Skeleton } from "~/components/ui/skeleton";
import { Replayer } from "rrweb";
import { MousePointer, Keyboard, Globe, Terminal } from "lucide-react";

// Import modular components
import NetworkTab from "~/components/analytics/NetworkTab";
import OverviewTab from "~/components/analytics/OverviewTab";
import InteractionsTab from "~/components/analytics/InteractionsTab";
import TimelineTab from "~/components/analytics/TimelineTab";
import InsightsTab from "~/components/analytics/InsightsTab";
import EnvironmentTab from "~/components/analytics/EnvironmentTab";

// Import types
import type {
  EventWithScreenshots,
  TimelineEvent,
  LLMTrainingData,
  AdvancedAnalytics,
} from "~/components/analytics/types";

// Import utilities
import {
  getNetworkDescription,
  getClickDescription,
  getKeypressDescription,
  estimateTimeSpent,
  extractPageFromUrl,
} from "~/components/analytics/utils";

const Analytics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const replayerRef = useRef<Replayer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Data structures for analytics
  const [networkData, setNetworkData] = useState<EventWithScreenshots[]>([]);
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const [consoleData, setConsoleData] = useState<any[]>([]);
  const [mouseClickData, setMouseClickData] = useState<EventWithScreenshots[]>(
    []
  );
  const [keypressData, setKeypressData] = useState<EventWithScreenshots[]>([]);
  // Store metadata for environment tab
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const [metadata, setMetadata] = useState<any>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const [allEvents, setAllEvents] = useState<any[]>([]);

  // Timeline events
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  // LLM training data
  const [llmTrainingData, setLlmTrainingData] =
    useState<LLMTrainingData | null>(null);

  // Advanced analytics
  const [advancedAnalytics, setAdvancedAnalytics] =
    useState<AdvancedAnalytics | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const sessionData = await getSession(id);
        const eventsData = await getEvents(id);

        setSession(sessionData as Session);
        setAllEvents(eventsData);

        // Find the start and end timestamps from events
        if (eventsData && eventsData.length > 0) {
          const startTime = eventsData[0].timestamp;
          const endTime = eventsData[eventsData.length - 1].timestamp;
          setRecordingStartTime(startTime);
          setRecordingDuration(Math.round((endTime - startTime) / 1000));
        }

        // Process events to extract different data types
        processEvents(eventsData);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Initialize hidden replayer for screenshots
  useEffect(() => {
    if (allEvents.length > 0 && containerRef.current) {
      try {
        // Create a hidden replayer
        const replayer = new Replayer(allEvents, {
          root: containerRef.current,
          skipInactive: true,
          showWarning: false,
          showDebug: false,
          blockClass: "screenshot-block",
          liveMode: false,
        });

        // Store the replayer instance
        replayerRef.current = replayer;

        // Process events to identify interaction points
        processInteractionEvents();
      } catch (error) {
        console.error("Error initializing replayer:", error);
      }
    }

    return () => {
      if (replayerRef.current) {
        // Clean up replayer
        replayerRef.current = null;
      }
    };
  }, [allEvents]);

  // Process events to identify interaction points
  const processInteractionEvents = () => {
    if (!allEvents.length) return;

    try {
      const processedNetworkData: EventWithScreenshots[] = [];
      const processedMouseClickData: EventWithScreenshots[] = [];
      const processedKeypressData: EventWithScreenshots[] = [];
      const processedTimelineEvents: TimelineEvent[] = [];

      // Track input field values
      const inputFieldValues: Record<string, string> = {};

      // Process each event type
      for (let i = 0; i < allEvents.length; i++) {
        const event = allEvents[i];

        // Look for input field values in type 3 events
        if (
          event.type === 3 &&
          event.data?.source === 5 &&
          typeof event.data.text === "string"
        ) {
          // This is an input field update event
          const inputId = event.data.id;
          if (inputId) {
            inputFieldValues[inputId] = event.data.text;
          }
        }

        // Also check for attribute updates that contain input values
        if (
          event.type === 3 &&
          event.data?.attributes &&
          Array.isArray(event.data.attributes)
        ) {
          interface AttributeItem {
            id?: string;
            attributes?: {
              value?: string;
              [key: string]: unknown;
            };
          }

          for (const attr of event.data.attributes as AttributeItem[]) {
            if (attr.id && attr.attributes && attr.attributes.value) {
              inputFieldValues[attr.id] = attr.attributes.value;
            }
          }
        }

        // Detect input change keypress pattern
        // Look for input change events (type 5 custom with inputChange type)
        if (
          event.type === 5 &&
          event.data?.tag === "custom" &&
          event.data.payload?.type === "inputChange"
        ) {
          // Get the inputChange data
          const payload = event.data.payload;
          const timestamp = event.timestamp;
          const relativeTime = timestamp - recordingStartTime;
          const eventId = `event-${timestamp}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          let inputValue = payload.data?.value || "";
          const target = payload.data?.element || "input";

          // Look back for any recent type 3 events that might contain related text
          let recentTextValue = "";
          if (i > 0) {
            // Check up to 3 previous events for text content
            for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
              const prevEvent = allEvents[j];
              if (
                prevEvent.type === 3 &&
                prevEvent.data?.source === 5 &&
                typeof prevEvent.data.text === "string"
              ) {
                recentTextValue = prevEvent.data.text;
                break;
              }
            }
          }

          // If we found text in previous events, use that
          if (recentTextValue && !inputValue) {
            inputValue = recentTextValue;
          }

          // Create an enhanced data object for the keypress
          const enhancedData = {
            target: target,
            key: "input", // We don't know exact key, but we know it was input
            inputValue: inputValue,
            element: payload.data?.element,
            timestamp: timestamp,
          };

          // Process as keypress
          processedKeypressData.push({
            id: eventId,
            timestamp,
            relativeTime,
            type: "keypress",
            beforeScreenshot: null,
            afterScreenshot: null,
            data: enhancedData,
          });

          // Add to timeline with improved description
          processedTimelineEvents.push({
            id: eventId,
            timestamp,
            relativeTime,
            type: "keypress",
            description: `Input changed to: "${inputValue}"`,
            details: enhancedData,
            icon: <Keyboard className="h-4 w-4" />,
            inputValue,
          });
        }

        if (event.type === 5 && event.data?.tag === "custom") {
          const payload = event.data.payload;
          const timestamp = event.timestamp;
          const relativeTime = timestamp - recordingStartTime;
          const eventId = `event-${timestamp}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          if (payload.type === "network") {
            // Process network request
            processedNetworkData.push({
              id: eventId,
              timestamp,
              relativeTime,
              type: "network",
              beforeScreenshot: null,
              afterScreenshot: null,
              data: payload.data,
            });

            // Add to timeline with improved description
            processedTimelineEvents.push({
              id: eventId,
              timestamp,
              relativeTime,
              type: "network",
              description: getNetworkDescription(payload.data),
              details: payload.data,
              icon: <Globe className="h-4 w-4" />,
            });
          } else if (payload.type === "mouseClick") {
            // Extract additional data
            const targetElement = payload.data.target || "";
            let parentElement = "";
            let href = "";
            let inputValue = "";
            let elementId = "";

            // Check for parent elements and href attributes
            if (payload.data.path && Array.isArray(payload.data.path)) {
              // Look for parent button or anchor tags
              for (const pathElement of payload.data.path) {
                if (
                  pathElement.tagName &&
                  pathElement.tagName.toLowerCase() === "button"
                ) {
                  parentElement = "button";
                  break;
                }
                if (
                  pathElement.tagName &&
                  pathElement.tagName.toLowerCase() === "a"
                ) {
                  parentElement = "a";
                  if (pathElement.attributes?.href) {
                    href = pathElement.attributes.href;
                  }
                  break;
                }

                // Capture element ID if available
                if (pathElement.id) {
                  elementId = pathElement.id;
                }
              }
            }

            // Check if this element has a known input value
            if (elementId && inputFieldValues[elementId]) {
              inputValue = inputFieldValues[elementId];
            }

            // Add parent and href info to the data
            const enhancedData = {
              ...payload.data,
              parentElement,
              href,
              inputValue,
            };

            // Process mouse click
            processedMouseClickData.push({
              id: eventId,
              timestamp,
              relativeTime,
              type: "mouseClick",
              beforeScreenshot: null,
              afterScreenshot: null,
              data: enhancedData,
            });

            // Add to timeline with improved description
            processedTimelineEvents.push({
              id: eventId,
              timestamp,
              relativeTime,
              type: "mouseClick",
              description: getClickDescription(enhancedData),
              details: enhancedData,
              icon: <MousePointer className="h-4 w-4" />,
              parentElement,
              href,
              inputValue,
            });
          } else if (payload.type === "keypress") {
            // Extract input value if available
            let inputValue = "";
            let elementId = "";

            // Check if element has ID
            if (payload.data.element?.id) {
              elementId = payload.data.element.id;
            }

            // Look ahead for input value in the next events
            if (i < allEvents.length - 2) {
              const nextEvent = allEvents[i + 1];
              // Check if the next event is a type 3 event with text content
              if (
                nextEvent.type === 3 &&
                nextEvent.data?.source === 5 &&
                typeof nextEvent.data.text === "string"
              ) {
                inputValue = nextEvent.data.text;

                // Also store this value for future reference
                if (nextEvent.data.id) {
                  inputFieldValues[nextEvent.data.id] = inputValue;
                }
              }
            }

            // If we didn't find a value in the next event, check our stored values
            if (!inputValue && elementId && inputFieldValues[elementId]) {
              inputValue = inputFieldValues[elementId];
            }

            // Add input value to the data
            const enhancedData = {
              ...payload.data,
              inputValue,
            };

            // Process keypress
            processedKeypressData.push({
              id: eventId,
              timestamp,
              relativeTime,
              type: "keypress",
              beforeScreenshot: null,
              afterScreenshot: null,
              data: enhancedData,
            });

            // Add to timeline with improved description
            processedTimelineEvents.push({
              id: eventId,
              timestamp,
              relativeTime,
              type: "keypress",
              description: getKeypressDescription(enhancedData),
              details: enhancedData,
              icon: <Keyboard className="h-4 w-4" />,
              inputValue,
            });
          }
        }
      }

      // Process console logs
      // biome-ignore lint/complexity/noForEach: <explanation>
      consoleData.forEach((log) => {
        processedTimelineEvents.push({
          id: `console-${log.timestamp}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          timestamp: log.timestamp,
          relativeTime: log.timestamp - recordingStartTime,
          type: "consoleLog",
          description: `Console ${log.level}: ${
            log.content
              ? log.content.substring(0, 50) +
                (log.content.length > 50 ? "..." : "")
              : ""
          }`,
          details: log,
          icon: <Terminal className="h-4 w-4" />,
        });
      });

      // Update state with processed data
      setNetworkData(processedNetworkData);
      setMouseClickData(processedMouseClickData);
      setKeypressData(processedKeypressData);

      // Sort timeline events by timestamp
      const sortedTimelineEvents = processedTimelineEvents.sort(
        (a, b) => a.timestamp - b.timestamp
      );
      setTimelineEvents(sortedTimelineEvents);

      // Generate LLM training data
      generateLLMTrainingData(sortedTimelineEvents);

      // Generate advanced analytics
      generateAdvancedAnalytics(sortedTimelineEvents);
    } catch (error) {
      console.error("Error processing interaction events:", error);
    }
  };

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const processEvents = (events: any[]) => {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const networkRequests: any[] = [];
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const consoleLogs: any[] = [];
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const mouseClicks: any[] = [];
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const keypresses: any[] = [];
    let metadataEvent = null;

    if (!events || events.length === 0) {
      console.log("No events to process");
      return;
    }

    console.log(`Processing ${events.length} events`);

    // biome-ignore lint/complexity/noForEach: <explanation>
    events.forEach((event) => {
      // Debug first few events to see their structure
      if (events.indexOf(event) < 5) {
        console.log(`Event ${events.indexOf(event)}:`, event);
      }

      // Process rrweb custom events (type 5 with custom tag)
      if (event.type === 5 && event.data?.tag === "custom") {
        const payload = event.data.payload;
        console.log("Found custom event:", payload);

        if (payload.type === "network") {
          networkRequests.push({
            ...payload.data,
            timestamp: event.timestamp,
          });
        } else if (payload.type === "consoleLog") {
          consoleLogs.push({
            ...payload.data,
            timestamp: event.timestamp,
          });
        } else if (payload.type === "mouseClick") {
          mouseClicks.push({
            ...payload.data,
            timestamp: event.timestamp,
          });
        } else if (payload.type === "keypress") {
          keypresses.push({
            ...payload.data,
            timestamp: event.timestamp,
          });
        } else if (payload.type === "metadata") {
          metadataEvent = payload.data;
        }
      }

      // Process console logs from rrweb plugin
      if (event.type === 6) {
        // Console plugin event type
        if (event.data?.plugin === "rrweb/console") {
          consoleLogs.push({
            level: event.data.payload.level,
            message: JSON.stringify(event.data.payload.payload),
            timestamp: event.timestamp,
          });
        }
      }
    });

    console.log(`Processed data:
      Network requests: ${networkRequests.length}
      Console logs: ${consoleLogs.length}
      Mouse clicks: ${mouseClicks.length}
      Keypresses: ${keypresses.length}
      Metadata: ${metadataEvent ? "Yes" : "No"}
    `);

    setConsoleData(consoleLogs);
    setMetadata(metadataEvent);
  };

  // Update a timeline event with user annotation
  const updateEventAnnotation = (eventId: string, annotation: string) => {
    setTimelineEvents((prev) => {
      const updated = prev.map((event) => {
        if (event.id === eventId) {
          return { ...event, userAnnotation: annotation };
        }
        return event;
      });

      // Update LLM training data with the new annotations
      generateLLMTrainingData(updated);

      return updated;
    });
  };

  // Generate structured data for LLM training
  const generateLLMTrainingData = (events: TimelineEvent[]) => {
    if (!session || !events.length) return;

    const trainingData: LLMTrainingData = {
      sessionId: session.id,
      sessionName: session.name,
      sessionDuration: recordingDuration,
      startTime: recordingStartTime,
      events: events.map((event) => ({
        timestamp: event.timestamp,
        relativeTime: event.relativeTime,
        type: event.type,
        details: event.details,
        context: event.description,
        userAnnotation: event.userAnnotation,
        inputValue: event.inputValue,
        parentElement: event.parentElement,
        href: event.href,
      })),
      metadata: metadata,
      analytics: advancedAnalytics
        ? {
            interactionPatterns: advancedAnalytics.interactionPatterns,
            navigationFlow: advancedAnalytics.navigationFlow,
            focusAreas: advancedAnalytics.focusAreas,
            timingMetrics: advancedAnalytics.timingMetrics,
            elementInteractions: advancedAnalytics.elementInteractions,
          }
        : undefined,
    };

    setLlmTrainingData(trainingData);
  };

  // Generate advanced analytics from timeline events
  const generateAdvancedAnalytics = (events: TimelineEvent[]) => {
    if (!events.length) return;

    try {
      // Initialize analytics structure
      const analytics: AdvancedAnalytics = {
        interactionPatterns: [],
        navigationFlow: [],
        focusAreas: [],
        timingMetrics: {
          averageTimeBetweenClicks: 0,
          averageTimeBetweenKeypresses: 0,
          totalIdleTime: 0,
          totalActiveTime: 0,
        },
        elementInteractions: [],
      };

      // Track element interactions
      const elementInteractions: Record<
        string,
        { count: number; types: Record<string, number> }
      > = {};

      // Track timing between events
      const clickTimestamps: number[] = [];
      const keypressTimestamps: number[] = [];
      let lastInteractionTime = events[0]?.timestamp || 0;
      let totalIdleTime = 0;

      // Track navigation flow
      let currentPage = "";
      const navigationFlow: Record<string, Record<string, number>> = {};

      // Process events for analytics
      events.forEach((event, index) => {
        // Calculate time since last interaction
        const timeSinceLastInteraction = event.timestamp - lastInteractionTime;

        // If more than 5 seconds have passed, consider it idle time
        if (timeSinceLastInteraction > 5000) {
          totalIdleTime += timeSinceLastInteraction;
        }

        // Update last interaction time
        lastInteractionTime = event.timestamp;

        // Process based on event type
        if (event.type === "mouseClick") {
          // Add to click timestamps
          clickTimestamps.push(event.timestamp);

          // Track element interaction
          const target = event.details.target || "unknown";
          if (!elementInteractions[target]) {
            elementInteractions[target] = { count: 0, types: {} };
          }
          elementInteractions[target].count++;
          if (!elementInteractions[target].types.click) {
            elementInteractions[target].types.click = 0;
          }
          elementInteractions[target].types.click++;
        } else if (event.type === "keypress") {
          // Add to keypress timestamps
          keypressTimestamps.push(event.timestamp);

          // Track element interaction
          const target = event.details.target || "unknown";
          if (!elementInteractions[target]) {
            elementInteractions[target] = { count: 0, types: {} };
          }
          elementInteractions[target].count++;
          if (!elementInteractions[target].types.keypress) {
            elementInteractions[target].types.keypress = 0;
          }
          elementInteractions[target].types.keypress++;
        } else if (event.type === "network") {
          // Check if this might be a page navigation
          const url = event.details.url || "";
          if (
            url.includes("html") ||
            !url.match(/\.(js|css|png|jpg|gif|svg|json)$/i)
          ) {
            const newPage = extractPageFromUrl(url);
            if (newPage && newPage !== currentPage) {
              // Record navigation flow
              if (!navigationFlow[currentPage]) {
                navigationFlow[currentPage] = {};
              }
              if (!navigationFlow[currentPage][newPage]) {
                navigationFlow[currentPage][newPage] = 0;
              }
              navigationFlow[currentPage][newPage]++;

              // Update current page
              currentPage = newPage;
            }
          }
        }

        // Look for patterns (sequence of 2 events)
        if (index > 0) {
          const prevEvent = events[index - 1];
          const pattern = `${prevEvent.type} → ${event.type}`;

          // Find or create pattern
          const existingPattern = analytics.interactionPatterns.find(
            (p) => p.pattern === pattern
          );
          if (existingPattern) {
            existingPattern.count++;
            existingPattern.averageTimeBetween =
              (existingPattern.averageTimeBetween *
                (existingPattern.count - 1) +
                (event.timestamp - prevEvent.timestamp)) /
              existingPattern.count;
          } else {
            analytics.interactionPatterns.push({
              pattern,
              count: 1,
              averageTimeBetween: event.timestamp - prevEvent.timestamp,
            });
          }
        }
      });

      // Calculate timing metrics
      if (clickTimestamps.length > 1) {
        let totalClickTime = 0;
        for (let i = 1; i < clickTimestamps.length; i++) {
          totalClickTime += clickTimestamps[i] - clickTimestamps[i - 1];
        }
        analytics.timingMetrics.averageTimeBetweenClicks =
          totalClickTime / (clickTimestamps.length - 1);
      }

      if (keypressTimestamps.length > 1) {
        let totalKeypressTime = 0;
        for (let i = 1; i < keypressTimestamps.length; i++) {
          totalKeypressTime +=
            keypressTimestamps[i] - keypressTimestamps[i - 1];
        }
        analytics.timingMetrics.averageTimeBetweenKeypresses =
          totalKeypressTime / (keypressTimestamps.length - 1);
      }

      analytics.timingMetrics.totalIdleTime = totalIdleTime;
      analytics.timingMetrics.totalActiveTime =
        (events[events.length - 1]?.timestamp || 0) -
        (events[0]?.timestamp || 0) -
        totalIdleTime;

      // Convert element interactions to array
      // biome-ignore lint/complexity/noForEach: <explanation>
      Object.entries(elementInteractions).forEach(([element, data]) => {
        // biome-ignore lint/complexity/noForEach: <explanation>
        Object.entries(data.types).forEach(([type, count]) => {
          analytics.elementInteractions.push({
            element,
            interactionType: type,
            count,
          });
        });
      });

      // Convert navigation flow to array
      // biome-ignore lint/complexity/noForEach: <explanation>
      Object.entries(navigationFlow).forEach(([from, toPages]) => {
        // biome-ignore lint/complexity/noForEach: <explanation>
        Object.entries(toPages).forEach(([to, count]) => {
          analytics.navigationFlow.push({ from, to, count });
        });
      });

      // Find focus areas (elements with most interactions)
      analytics.focusAreas = Object.entries(elementInteractions)
        .map(([element, data]) => ({
          element,
          timeSpent: estimateTimeSpent(element, events),
          interactionCount: data.count,
        }))
        .sort((a, b) => b.interactionCount - a.interactionCount)
        .slice(0, 5);

      // Update state with analytics
      setAdvancedAnalytics(analytics);

      // Update LLM training data with analytics
      if (llmTrainingData) {
        setLlmTrainingData({
          ...llmTrainingData,
          analytics: {
            interactionPatterns: analytics.interactionPatterns,
            navigationFlow: analytics.navigationFlow,
            focusAreas: analytics.focusAreas,
            timingMetrics: analytics.timingMetrics,
            elementInteractions: analytics.elementInteractions,
          },
        });
      }
    } catch (error) {
      console.error("Error generating advanced analytics:", error);
    }
  };

  // Download LLM training data as JSON
  const downloadLLMTrainingData = () => {
    if (!llmTrainingData) return;

    const dataStr = JSON.stringify(llmTrainingData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `session-${llmTrainingData.sessionId}-llm-training.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-12 w-full mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!session) {
    return <div className="container mx-auto p-4">Session not found</div>;
  }

  // Prepare data for charts
  const networkStatusData = networkData.reduce(
    (acc: { name: string; value: number }[], curr) => {
      const status =
        typeof curr.data.status === "number"
          ? curr.data.status >= 200 && curr.data.status < 300
            ? "2xx"
            : curr.data.status >= 300 && curr.data.status < 400
            ? "3xx"
            : curr.data.status >= 400 && curr.data.status < 500
            ? "4xx"
            : curr.data.status >= 500
            ? "5xx"
            : "Other"
          : "Error";

      const existingItem = acc.find((item) => item.name === status);
      if (existingItem) {
        existingItem.value += 1;
      } else {
        acc.push({ name: status, value: 1 });
      }
      return acc;
    },
    [] as { name: string; value: number }[]
  );

  const consoleTypeData = consoleData.reduce(
    (acc: { name: string; value: number }[], curr) => {
      const level = curr.level || "unknown";

      const existingItem = acc.find((item) => item.name === level);
      if (existingItem) {
        existingItem.value += 1;
      } else {
        acc.push({ name: level, value: 1 });
      }
      return acc;
    },
    [] as { name: string; value: number }[]
  );

  // Used in the Environment tab to show click targets
  const mouseClickTargetData =
    mouseClickData.length > 0
      ? mouseClickData.reduce(
          (acc: { name: string; value: number }[], curr) => {
            const target = curr.data.target || "unknown";

            const existingItem = acc.find((item) => item.name === target);
            if (existingItem) {
              existingItem.value += 1;
            } else {
              acc.push({ name: target, value: 1 });
            }
            return acc;
          },
          [] as { name: string; value: number }[]
        )
      : [];

  return (
    <>
      <div className="container mx-auto p-4">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">
            Session Analytics: {session.name}
          </h1>
          <p className="text-muted-foreground">
            Recorded on {new Date(session.createTimestamp).toLocaleString()} •
            Duration: {recordingDuration}s
          </p>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-7 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="network">
                Network ({networkData.length})
              </TabsTrigger>
              <TabsTrigger value="console">
                Console ({consoleData.length})
              </TabsTrigger>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="environment">Environment</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <OverviewTab
                networkStatusData={networkStatusData}
                consoleTypeData={consoleTypeData}
              />
            </TabsContent>

            {/* Network Tab */}
            <TabsContent value="network">
              <NetworkTab
                networkData={networkData}
                allEvents={allEvents}
                recordingStartTime={recordingStartTime}
              />
            </TabsContent>

            {/* Interactions Tab */}
            <TabsContent value="interactions">
              <InteractionsTab
                mouseClickData={mouseClickData}
                keypressData={keypressData}
                allEvents={allEvents}
                recordingStartTime={recordingStartTime}
              />
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline">
              <TimelineTab
                timelineEvents={timelineEvents}
                llmTrainingData={llmTrainingData}
                onAnnotationUpdate={updateEventAnnotation}
                downloadLLMTrainingData={downloadLLMTrainingData}
                allEvents={allEvents}
                recordingStartTime={recordingStartTime}
              />
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights">
              <InsightsTab analytics={advancedAnalytics} />
            </TabsContent>

            {/* Environment Tab */}
            <TabsContent value="environment">
              <EnvironmentTab
                metadata={metadata}
                mouseClickTargetData={mouseClickTargetData}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Hidden container for replayer */}
      <div
        ref={containerRef}
        className="hidden"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1024px",
          height: "768px",
        }}
      />
    </>
  );
};

export default Analytics;
