import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import type { Session } from '~/types';
import { getSession, getEvents } from '~/utils/storage';
import { Skeleton } from '~/components/ui/skeleton';
import { Badge } from '~/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Replayer } from 'rrweb';
import RRWebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';
import { Button } from '~/components/ui/button';
import { Eye, Download, MousePointer, Keyboard, Globe, Terminal } from 'lucide-react';
// Import Dialog components from the newly created file
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '~/components/ui/dialog';
// Import Scribe-like flow controller
import ScribeFlowController from '~/components/ScribeFlowController';

// Define colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface EventWithScreenshots {
  id: string;
  relativeTime: number;
  type: 'network' | 'mouseClick' | 'keypress' | 'consoleLog';
  timestamp: number;
  beforeScreenshot: string | null;
  afterScreenshot: string | null;
  data: any;
}

// Interface for timeline events
interface TimelineEvent {
  id: string;
  timestamp: number;
  relativeTime: number;
  type: 'network' | 'mouseClick' | 'keypress' | 'consoleLog';
  description: string;
  details: any;
  icon: React.ReactNode;
  userAnnotation?: string; // User's explanation of what they were trying to do
  inputValue?: string;
  parentElement?: string;
  href?: string;
}

// Interface for LLM training data
interface LLMTrainingData {
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
interface AdvancedAnalytics {
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

const Analytics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const replayerRef = useRef<Replayer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Data structures for analytics
  const [networkData, setNetworkData] = useState<EventWithScreenshots[]>([]);
  const [consoleData, setConsoleData] = useState<any[]>([]);
  const [mouseClickData, setMouseClickData] = useState<EventWithScreenshots[]>([]);
  const [keypressData, setKeypressData] = useState<EventWithScreenshots[]>([]);
  // Store metadata for environment tab
  const [metadata, setMetadata] = useState<any>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [allEvents, setAllEvents] = useState<any[]>([]);

  // Timeline events
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  // LLM training data
  const [llmTrainingData, setLlmTrainingData] = useState<LLMTrainingData | null>(null);

  // Advanced analytics
  const [advancedAnalytics, setAdvancedAnalytics] = useState<AdvancedAnalytics | null>(null);



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
        console.error('Error fetching data:', error);
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
          blockClass: 'screenshot-block',
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
        if (event.type === 3 && event.data?.source === 5 && typeof event.data.text === 'string') {
          // This is an input field update event
          const inputId = event.data.id;
          if (inputId) {
            inputFieldValues[inputId] = event.data.text;
          }
        }

        // Also check for attribute updates that contain input values
        if (event.type === 3 && event.data?.attributes && Array.isArray(event.data.attributes)) {
          event.data.attributes.forEach((attr: any) => {
            if (attr.id && attr.attributes && attr.attributes.value) {
              inputFieldValues[attr.id] = attr.attributes.value;
            }
          });
        }

        if (event.type === 5 && event.data?.tag === 'custom') {
          const payload = event.data.payload;
          const timestamp = event.timestamp;
          const relativeTime = timestamp - recordingStartTime;
          const eventId = `event-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

          if (payload.type === 'network') {
            // Process network request
            processedNetworkData.push({
              id: eventId,
              timestamp,
              relativeTime,
              type: 'network',
              beforeScreenshot: null,
              afterScreenshot: null,
              data: payload.data
            });

            // Add to timeline with improved description
            processedTimelineEvents.push({
              id: eventId,
              timestamp,
              relativeTime,
              type: 'network',
              description: getNetworkDescription(payload.data),
              details: payload.data,
              icon: <Globe className="h-4 w-4" />
            });
          } else if (payload.type === 'mouseClick') {
            // Extract additional data
            const targetElement = payload.data.target || '';
            let parentElement = '';
            let href = '';
            let inputValue = '';
            let elementId = '';

            // Check for parent elements and href attributes
            if (payload.data.path && Array.isArray(payload.data.path)) {
              // Look for parent button or anchor tags
              for (const pathElement of payload.data.path) {
                if (pathElement.tagName && pathElement.tagName.toLowerCase() === 'button') {
                  parentElement = 'button';
                  break;
                } else if (pathElement.tagName && pathElement.tagName.toLowerCase() === 'a') {
                  parentElement = 'a';
                  if (pathElement.attributes && pathElement.attributes.href) {
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
              inputValue
            };

            // Process mouse click
            processedMouseClickData.push({
              id: eventId,
              timestamp,
              relativeTime,
              type: 'mouseClick',
              beforeScreenshot: null,
              afterScreenshot: null,
              data: enhancedData
            });

            // Add to timeline with improved description
            processedTimelineEvents.push({
              id: eventId,
              timestamp,
              relativeTime,
              type: 'mouseClick',
              description: getClickDescription(enhancedData),
              details: enhancedData,
              icon: <MousePointer className="h-4 w-4" />,
              parentElement,
              href,
              inputValue
            });
          } else if (payload.type === 'keypress') {
            // Extract input value if available
            let inputValue = '';
            let elementId = '';

            // Check if element has ID
            if (payload.data.element && payload.data.element.id) {
              elementId = payload.data.element.id;
            }

            // Look ahead for input value in the next events
            if (i < allEvents.length - 2) {
              const nextEvent = allEvents[i + 1];
              // Check if the next event is a type 3 event with text content
              if (nextEvent.type === 3 &&
                nextEvent.data?.source === 5 &&
                typeof nextEvent.data.text === 'string') {
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
              inputValue
            };

            // Process keypress
            processedKeypressData.push({
              id: eventId,
              timestamp,
              relativeTime,
              type: 'keypress',
              beforeScreenshot: null,
              afterScreenshot: null,
              data: enhancedData
            });

            // Add to timeline with improved description
            processedTimelineEvents.push({
              id: eventId,
              timestamp,
              relativeTime,
              type: 'keypress',
              description: getKeypressDescription(enhancedData),
              details: enhancedData,
              icon: <Keyboard className="h-4 w-4" />,
              inputValue
            });
          }
        }
      }

      // Process console logs
      consoleData.forEach((log) => {
        processedTimelineEvents.push({
          id: `console-${log.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: log.timestamp,
          relativeTime: log.timestamp - recordingStartTime,
          type: 'consoleLog',
          description: `Console ${log.level}: ${truncateString(log.content, 50)}`,
          details: log,
          icon: <Terminal className="h-4 w-4" />
        });
      });

      // Update state with processed data
      setNetworkData(processedNetworkData);
      setMouseClickData(processedMouseClickData);
      setKeypressData(processedKeypressData);

      // Sort timeline events by timestamp
      const sortedTimelineEvents = processedTimelineEvents.sort((a, b) => a.timestamp - b.timestamp);
      setTimelineEvents(sortedTimelineEvents);

      // Generate LLM training data
      generateLLMTrainingData(sortedTimelineEvents);

      // Generate advanced analytics
      generateAdvancedAnalytics(sortedTimelineEvents);
    } catch (error) {
      console.error("Error processing interaction events:", error);
    }
  };

  // Get a more meaningful description for network requests
  const getNetworkDescription = (data: any): string => {
    try {
      const method = data.method || 'REQUEST';
      const url = data.url || '';
      const status = typeof data.status === 'number' ? data.status : 'pending';

      // Try to determine the purpose of the request
      let purpose = '';
      if (url.includes('/api/') || url.includes('/graphql')) {
        purpose = 'API call';
      } else if (url.endsWith('.json')) {
        purpose = 'JSON data fetch';
      } else if (url.endsWith('.js')) {
        purpose = 'JavaScript resource';
      } else if (url.endsWith('.css')) {
        purpose = 'CSS resource';
      } else if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
        purpose = 'Image resource';
      }

      // Construct a meaningful description
      let description = `${method} ${truncateUrl(url)}`;
      if (purpose) {
        description += ` (${purpose})`;
      }
      if (status !== 'pending') {
        description += ` - Status: ${status}`;
      }

      return description;
    } catch (e) {
      return `${data.method || 'REQUEST'} ${truncateUrl(data.url || '')}`;
    }
  };

  // Get a more meaningful description for mouse clicks
  const getClickDescription = (data: any): string => {
    try {
      const target = data.target || 'element';
      const x = data.x || 0;
      const y = data.y || 0;

      // Check if the target has semantic meaning
      let meaningfulTarget = target;
      let parentInfo = data.parentElement || '';
      let hrefInfo = data.href || '';

      // Check for parent button or anchor
      if (parentInfo.includes('button')) {
        return `Clicked a button (${parentInfo}) at (${x}, ${y})`;
      } else if (parentInfo.includes('a')) {
        const linkText = hrefInfo ? ` (${hrefInfo})` : '';
        return `Clicked a link${linkText} at (${x}, ${y})`;
      }

      // Check for common interactive elements
      if (target.toLowerCase() === 'button' || target.includes('btn')) {
        return `Clicked a button at (${x}, ${y})`;
      } else if (target.toLowerCase() === 'a') {
        const linkText = hrefInfo ? ` (${hrefInfo})` : '';
        return `Clicked a link${linkText} at (${x}, ${y})`;
      } else if (target.toLowerCase() === 'input') {
        const inputType = data.inputType || 'text';
        return `Clicked an ${inputType} input at (${x}, ${y})`;
      } else if (target.toLowerCase() === 'select') {
        return `Clicked a dropdown at (${x}, ${y})`;
      } else if (target.toLowerCase() === 'label') {
        return `Clicked a form label at (${x}, ${y})`;
      } else if (target.toLowerCase() === 'img') {
        return `Clicked an image at (${x}, ${y})`;
      } else if (target.toLowerCase() === 'svg') {
        return `Clicked an icon at (${x}, ${y})`;
      } else if (target.toLowerCase() === 'span' || target.toLowerCase() === 'div') {
        return `Clicked an interface element at (${x}, ${y})`;
      }

      return `Clicked on ${meaningfulTarget} at (${x}, ${y})`;
    } catch (e) {
      return `Clicked at (${data.x || 0}, ${data.y || 0})`;
    }
  };

  // Get a more meaningful description for keypresses
  const getKeypressDescription = (data: any): string => {
    try {
      const key = data.key || '';
      const target = data.target || 'element';
      const inputValue = data.inputValue || '';

      // Check for special keys
      if (key === 'Enter') {
        if (target.toLowerCase() === 'input') {
          const valueInfo = inputValue ? ` (entered: "${truncateString(inputValue, 30)}")` : '';
          return `Pressed Enter to submit input${valueInfo}`;
        } else if (target.toLowerCase() === 'textarea') {
          return `Pressed Enter for new line in textarea`;
        } else {
          return `Pressed Enter to confirm action`;
        }
      } else if (key === 'Escape') {
        return `Pressed Escape to cancel`;
      } else if (key === 'Tab') {
        return `Pressed Tab to navigate`;
      } else if (key === 'Backspace') {
        return `Pressed Backspace to delete`;
      } else if (key === 'Delete') {
        return `Pressed Delete to remove content`;
      } else if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
        return `Pressed ${key} to navigate`;
      }

      // For regular typing
      if (target.toLowerCase() === 'input' || target.toLowerCase() === 'textarea') {
        const valueInfo = inputValue ? ` (content: "${truncateString(inputValue, 30)}")` : '';
        return `Typed in a ${target.toLowerCase()}${valueInfo}`;
      }

      return `Pressed ${data.key || ''} key`;
    } catch (e) {
      return `Pressed ${data.key || ''} key`;
    }
  };

  // Update a timeline event with user annotation
  const updateEventAnnotation = (eventId: string, annotation: string) => {
    setTimelineEvents(prev => {
      const updated = prev.map(event => {
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
      events: events.map(event => ({
        timestamp: event.timestamp,
        relativeTime: event.relativeTime,
        type: event.type,
        details: event.details,
        context: event.description,
        userAnnotation: event.userAnnotation,
        inputValue: event.inputValue,
        parentElement: event.parentElement,
        href: event.href
      })),
      metadata: metadata,
      analytics: advancedAnalytics ? {
        interactionPatterns: advancedAnalytics.interactionPatterns,
        navigationFlow: advancedAnalytics.navigationFlow,
        focusAreas: advancedAnalytics.focusAreas,
        timingMetrics: advancedAnalytics.timingMetrics,
        elementInteractions: advancedAnalytics.elementInteractions
      } : undefined
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
          totalActiveTime: 0
        },
        elementInteractions: []
      };

      // Track element interactions
      const elementInteractions: Record<string, { count: number, types: Record<string, number> }> = {};

      // Track timing between events
      const clickTimestamps: number[] = [];
      const keypressTimestamps: number[] = [];
      let lastInteractionTime = events[0]?.timestamp || 0;
      let totalIdleTime = 0;

      // Track navigation flow
      let currentPage = '';
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
        if (event.type === 'mouseClick') {
          // Add to click timestamps
          clickTimestamps.push(event.timestamp);

          // Track element interaction
          const target = event.details.target || 'unknown';
          if (!elementInteractions[target]) {
            elementInteractions[target] = { count: 0, types: {} };
          }
          elementInteractions[target].count++;
          if (!elementInteractions[target].types['click']) {
            elementInteractions[target].types['click'] = 0;
          }
          elementInteractions[target].types['click']++;

        } else if (event.type === 'keypress') {
          // Add to keypress timestamps
          keypressTimestamps.push(event.timestamp);

          // Track element interaction
          const target = event.details.target || 'unknown';
          if (!elementInteractions[target]) {
            elementInteractions[target] = { count: 0, types: {} };
          }
          elementInteractions[target].count++;
          if (!elementInteractions[target].types['keypress']) {
            elementInteractions[target].types['keypress'] = 0;
          }
          elementInteractions[target].types['keypress']++;

        } else if (event.type === 'network') {
          // Check if this might be a page navigation
          const url = event.details.url || '';
          if (url.includes('html') || !url.match(/\.(js|css|png|jpg|gif|svg|json)$/i)) {
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
          const existingPattern = analytics.interactionPatterns.find(p => p.pattern === pattern);
          if (existingPattern) {
            existingPattern.count++;
            existingPattern.averageTimeBetween =
              (existingPattern.averageTimeBetween * (existingPattern.count - 1) +
                (event.timestamp - prevEvent.timestamp)) / existingPattern.count;
          } else {
            analytics.interactionPatterns.push({
              pattern,
              count: 1,
              averageTimeBetween: event.timestamp - prevEvent.timestamp
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
        analytics.timingMetrics.averageTimeBetweenClicks = totalClickTime / (clickTimestamps.length - 1);
      }

      if (keypressTimestamps.length > 1) {
        let totalKeypressTime = 0;
        for (let i = 1; i < keypressTimestamps.length; i++) {
          totalKeypressTime += keypressTimestamps[i] - keypressTimestamps[i - 1];
        }
        analytics.timingMetrics.averageTimeBetweenKeypresses = totalKeypressTime / (keypressTimestamps.length - 1);
      }

      analytics.timingMetrics.totalIdleTime = totalIdleTime;
      analytics.timingMetrics.totalActiveTime =
        (events[events.length - 1]?.timestamp || 0) -
        (events[0]?.timestamp || 0) -
        totalIdleTime;

      // Convert element interactions to array
      Object.entries(elementInteractions).forEach(([element, data]) => {
        Object.entries(data.types).forEach(([type, count]) => {
          analytics.elementInteractions.push({
            element,
            interactionType: type,
            count
          });
        });
      });

      // Convert navigation flow to array
      Object.entries(navigationFlow).forEach(([from, toPages]) => {
        Object.entries(toPages).forEach(([to, count]) => {
          analytics.navigationFlow.push({ from, to, count });
        });
      });

      // Find focus areas (elements with most interactions)
      analytics.focusAreas = Object.entries(elementInteractions)
        .map(([element, data]) => ({
          element,
          timeSpent: estimateTimeSpent(element, events),
          interactionCount: data.count
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
            elementInteractions: analytics.elementInteractions
          }
        });
      }
    } catch (error) {
      console.error("Error generating advanced analytics:", error);
    }
  };

  // Helper function to extract page name from URL
  const extractPageFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;

      // Extract the last part of the path
      const parts = path.split('/').filter(Boolean);
      if (parts.length > 0) {
        const lastPart = parts[parts.length - 1];
        // Remove file extension if present
        return lastPart.replace(/\.[^/.]+$/, "") || urlObj.hostname;
      }

      return urlObj.hostname;
    } catch (e) {
      // If URL parsing fails, just return the original
      return url;
    }
  };

  // Estimate time spent on an element
  const estimateTimeSpent = (element: string, events: TimelineEvent[]): number => {
    let totalTime = 0;
    let lastInteractionTime = 0;

    events.forEach(event => {
      const target =
        event.type === 'mouseClick' || event.type === 'keypress'
          ? event.details.target
          : null;

      if (target === element) {
        if (lastInteractionTime > 0) {
          // If this is not the first interaction with this element
          const timeDiff = event.timestamp - lastInteractionTime;
          // Only count if less than 30 seconds (to avoid counting time when user left the page)
          if (timeDiff < 30000) {
            totalTime += timeDiff;
          }
        }
        lastInteractionTime = event.timestamp;
      }
    });

    return totalTime;
  };

  // Helper function to truncate URLs
  const truncateUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.length > 20
        ? urlObj.pathname.substring(0, 17) + '...'
        : urlObj.pathname;
      return `${urlObj.hostname}${path}`;
    } catch (e) {
      return url.length > 30 ? url.substring(0, 27) + '...' : url;
    }
  };

  // Helper function to truncate strings
  const truncateString = (str: string, maxLength: number): string => {
    return str.length > maxLength ? str.substring(0, maxLength - 3) + '...' : str;
  };

  // Download LLM training data as JSON
  const downloadLLMTrainingData = () => {
    if (!llmTrainingData) return;

    const dataStr = JSON.stringify(llmTrainingData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${llmTrainingData.sessionId}-llm-training.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Component to display event visualization using rrweb's replayer
  const EventVisualization = ({ event }: { event: EventWithScreenshots }) => {
    const visualizationRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);

    // Initialize replayer when dialog opens
    useEffect(() => {
      if (visualizationRef.current && allEvents.length > 0 && !playerRef.current) {
        try {
          // Create a new player instance
          playerRef.current = new RRWebPlayer({
            target: visualizationRef.current,
            props: {
              events: allEvents,
              autoPlay: false,
              showController: true,
              width: 800,
              height: 450,
              skipInactive: true,
              speedOption: [1, 2, 4, 8],
              // Use string values for tags as required by the type
              tags: {
                network: '#3498db',
                mouseClick: '#e74c3c',
                keypress: '#2ecc71'
              }
            },
          });

          // Jump to the timestamp of the event (slightly before)
          const beforeTime = Math.max(0, event.timestamp - 1000); // 1 second before
          setTimeout(() => {
            if (playerRef.current) {
              playerRef.current.pause();
              playerRef.current.goto(beforeTime, false);
              setIsReady(true);
            }
          }, 500);

          return () => {
            // Clean up
            if (playerRef.current) {
              // Use the proper destroy method
              if (typeof playerRef.current.$destroy === 'function') {
                playerRef.current.$destroy();
              }
              playerRef.current = null;
            }
          };
        } catch (error) {
          console.error("Error creating visualization player:", error);
        }
      }
    }, [visualizationRef.current, event.timestamp, allEvents]);

    return (
      <div className="grid grid-cols-1 gap-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Event Visualization</h3>
          <div className="flex justify-center">
            <div
              ref={visualizationRef}
              className="border rounded-md bg-gray-50"
            >
              {!isReady && (
                <div className="flex items-center justify-center h-[450px] w-[800px]">
                  <p className="text-muted-foreground">Loading visualization...</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-2">Event Details</h3>
          <div className="bg-muted p-4 rounded-md">
            <div className="mb-2">
              <span className="font-semibold">Time:</span> {new Date(event.timestamp).toLocaleTimeString()}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Type:</span> {event.id.split('-')[0]}
            </div>
            <pre className="text-xs font-mono bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(event.data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  const processEvents = (events: any[]) => {
    const networkRequests: any[] = [];
    const consoleLogs: any[] = [];
    const mouseClicks: any[] = [];
    const keypresses: any[] = [];
    let metadataEvent = null;

    if (!events || events.length === 0) {
      console.log("No events to process");
      return;
    }

    console.log(`Processing ${events.length} events`);

    events.forEach((event) => {
      // Debug first few events to see their structure
      if (events.indexOf(event) < 5) {
        console.log(`Event ${events.indexOf(event)}:`, event);
      }

      // Process rrweb custom events (type 5 with custom tag)
      if (event.type === 5 && event.data?.tag === 'custom') {
        const payload = event.data.payload;
        console.log('Found custom event:', payload);

        if (payload.type === 'network') {
          networkRequests.push({
            ...payload.data,
            timestamp: event.timestamp
          });
        } else if (payload.type === 'consoleLog') {
          consoleLogs.push({
            ...payload.data,
            timestamp: event.timestamp
          });
        } else if (payload.type === 'mouseClick') {
          mouseClicks.push({
            ...payload.data,
            timestamp: event.timestamp
          });
        } else if (payload.type === 'keypress') {
          keypresses.push({
            ...payload.data,
            timestamp: event.timestamp
          });
        } else if (payload.type === 'metadata') {
          metadataEvent = payload.data;
        }
      }

      // Process console logs from rrweb plugin
      if (event.type === 6) { // Console plugin event type
        if (event.data?.plugin === 'rrweb/console') {
          consoleLogs.push({
            level: event.data.payload.level,
            message: JSON.stringify(event.data.payload.payload),
            timestamp: event.timestamp
          });
        }
      }
    });

    console.log(`Processed data:
      Network requests: ${networkRequests.length}
      Console logs: ${consoleLogs.length}
      Mouse clicks: ${mouseClicks.length}
      Keypresses: ${keypresses.length}
      Metadata: ${metadataEvent ? 'Yes' : 'No'}
    `);

    setConsoleData(consoleLogs);
    setMetadata(metadataEvent);

    // Note: Network, mouse clicks, and keypress data will be set with screenshots
    // in the generateScreenshots function
  };

  const EventScreenshotDialog = ({ event }: { event: EventWithScreenshots }) => {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" /> View
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Event at {new Date(event.timestamp).toLocaleTimeString()}</DialogTitle>
          </DialogHeader>
          <EventVisualization event={event} />
        </DialogContent>
      </Dialog>
    );
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
  const networkStatusData = networkData.reduce((acc: { name: string, value: number }[], curr) => {
    const status = typeof curr.data.status === 'number'
      ? curr.data.status >= 200 && curr.data.status < 300 ? '2xx'
        : curr.data.status >= 300 && curr.data.status < 400 ? '3xx'
          : curr.data.status >= 400 && curr.data.status < 500 ? '4xx'
            : curr.data.status >= 500 ? '5xx' : 'Other'
      : 'Error';

    const existingItem = acc.find(item => item.name === status);
    if (existingItem) {
      existingItem.value += 1;
    } else {
      acc.push({ name: status, value: 1 });
    }
    return acc;
  }, [] as { name: string, value: number }[]);

  const consoleTypeData = consoleData.reduce((acc: { name: string, value: number }[], curr) => {
    const level = curr.level || 'unknown';

    const existingItem = acc.find(item => item.name === level);
    if (existingItem) {
      existingItem.value += 1;
    } else {
      acc.push({ name: level, value: 1 });
    }
    return acc;
  }, [] as { name: string, value: number }[]);

  // Used in the Environment tab to show click targets
  const mouseClickTargetData = mouseClickData.length > 0 ? mouseClickData.reduce((acc: { name: string, value: number }[], curr) => {
    const target = curr.data.target || 'unknown';

    const existingItem = acc.find(item => item.name === target);
    if (existingItem) {
      existingItem.value += 1;
    } else {
      acc.push({ name: target, value: 1 });
    }
    return acc;
  }, [] as { name: string, value: number }[]) : [];

  // Timeline event component
  const TimelineEventItem = ({ event }: { event: TimelineEvent }) => {
    const [annotation, setAnnotation] = useState(event.userAnnotation || '');
    const [isEditing, setIsEditing] = useState(false);

    const handleSaveAnnotation = () => {
      updateEventAnnotation(event.id, annotation);
      setIsEditing(false);
    };

    // Format additional details for display
    const getAdditionalDetails = () => {
      const details = [];

      if (event.inputValue) {
        details.push(`Input value: "${truncateString(event.inputValue, 50)}"`);
      }

      if (event.parentElement) {
        details.push(`Parent element: ${event.parentElement}`);
      }

      if (event.href) {
        details.push(`Link: ${event.href}`);
      }

      return details;
    };

    const additionalDetails = getAdditionalDetails();

    return (
      <div className="flex mb-8 relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-muted-foreground/20 -z-10"></div>

        {/* Event icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white z-10">
          {event.icon}
        </div>

        {/* Event content */}
        <div className="ml-4 flex-grow">
          <div className="flex items-center mb-1">
            <span className="text-xs text-muted-foreground mr-2">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
            <Badge variant="outline" className="text-xs">
              {event.type}
            </Badge>
          </div>
          <p className="text-sm mb-1 font-medium">{event.description}</p>

          {/* User annotation section */}
          <div className="mb-2 bg-muted/30 p-2 rounded-md">
            {isEditing ? (
              <div>
                <textarea
                  className="w-full p-2 text-sm rounded-md border border-input bg-background"
                  value={annotation}
                  onChange={(e) => setAnnotation(e.target.value)}
                  placeholder="What were you trying to do here?"
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveAnnotation}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="flex justify-between items-center cursor-pointer hover:bg-muted/50 p-2 rounded-md"
                onClick={() => setIsEditing(true)}
              >
                <span className="text-sm text-muted-foreground italic">
                  {event.userAnnotation ?
                    `"${event.userAnnotation}"` :
                    "Click to add your intention for this action..."}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  {event.userAnnotation ? 'Edit' : 'Add'}
                </Button>
              </div>
            )}
          </div>

          {/* Event details */}
          <Card className="bg-muted/50">
            <CardContent className="p-2 text-xs">
              <div className="grid gap-1">
                {Object.entries(event.details).map(([key, value]) => {
                  // Skip complex objects and arrays
                  if (typeof value === 'object' || Array.isArray(value)) return null;
                  return (
                    <div key={key} className="flex">
                      <span className="font-medium mr-2">{key}:</span>
                      <span className="text-muted-foreground">{String(value)}</span>
                    </div>
                  );
                })}

                {/* Show additional extracted details */}
                {additionalDetails.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-muted">
                    <p className="font-medium mb-1">Additional Details:</p>
                    {additionalDetails.map((detail, index) => (
                      <div key={index} className="text-muted-foreground">{detail}</div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="container mx-auto p-4">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">Session Analytics: {session.name}</h1>
          <p className="text-muted-foreground">
            Recorded on {new Date(session.createTimestamp).toLocaleString()} •
            Duration: {recordingDuration}s
          </p>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-7 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="network">Network ({networkData.length})</TabsTrigger>
              <TabsTrigger value="console">Console ({consoleData.length})</TabsTrigger>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="environment">Environment</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Network Requests</CardTitle>
                    <CardDescription>Distribution of network request statuses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {networkStatusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={networkStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {networkStatusData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[250px]">
                        <p className="text-muted-foreground">No network data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Console Logs</CardTitle>
                    <CardDescription>Distribution of console log types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {consoleTypeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          data={consoleTypeData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[250px]">
                        <p className="text-muted-foreground">No console data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Network Tab */}
            <TabsContent value="network">
              <Card>
                <CardHeader>
                  <CardTitle>Network Requests</CardTitle>
                  <CardDescription>All captured network requests during the session</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    {networkData.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>URL</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Screenshots</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {networkData.map((request, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono text-xs truncate max-w-[300px]">
                                {request.data.url}
                              </TableCell>
                              <TableCell>
                                <Badge variant={request.data.method === 'GET' ? 'default' : 'secondary'}>
                                  {request.data.method}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {typeof request.data.status === 'number' ? (
                                  <Badge
                                    variant={
                                      request.data.status >= 200 && request.data.status < 300 ? 'default' :
                                        request.data.status >= 300 && request.data.status < 400 ? 'secondary' :
                                          'destructive'
                                    }
                                  >
                                    {request.data.status}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">{request.data.status}</Badge>
                                )}
                              </TableCell>
                              <TableCell>{request.data.type}</TableCell>
                              <TableCell>
                                {request.data.duration ? `${request.data.duration}ms` : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <EventScreenshotDialog event={request} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="flex items-center justify-center h-[300px]">
                        <p className="text-muted-foreground">No network requests captured</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Interactions Tab */}
            <TabsContent value="interactions">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Mouse Clicks</CardTitle>
                    <CardDescription>All captured mouse clicks during the session</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      {mouseClickData.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Element</TableHead>
                              <TableHead>Position</TableHead>
                              <TableHead>Button</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Screenshots</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mouseClickData.map((click, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Badge variant="outline">{click.data.target}</Badge>
                                </TableCell>
                                <TableCell>
                                  {click.data.x}, {click.data.y}
                                </TableCell>
                                <TableCell>
                                  {click.data.button === 0 ? 'Left' :
                                    click.data.button === 1 ? 'Middle' :
                                      click.data.button === 2 ? 'Right' : click.data.button}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {new Date(click.timestamp).toLocaleTimeString()}
                                </TableCell>
                                <TableCell>
                                  <EventScreenshotDialog event={click} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="flex items-center justify-center h-[300px]">
                          <p className="text-muted-foreground">No mouse clicks captured</p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Keypresses</CardTitle>
                    <CardDescription>All captured keypresses during the session</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      {keypressData.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Key</TableHead>
                              <TableHead>Target</TableHead>
                              <TableHead>Modifier</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Screenshots</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {keypressData.map((keypress, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Badge>{keypress.data.key}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{keypress.data.target}</Badge>
                                </TableCell>
                                <TableCell>
                                  {keypress.data.isMetaKey ? 'Yes' : 'No'}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {new Date(keypress.timestamp).toLocaleTimeString()}
                                </TableCell>
                                <TableCell>
                                  <EventScreenshotDialog event={keypress} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="flex items-center justify-center h-[300px]">
                          <p className="text-muted-foreground">No keypresses captured</p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Scribe Flow Tab */}
            <TabsContent value="scribe">
              <ScribeFlowController
                sessionId={id || ''}
                events={allEvents}
                loading={loading}
              />
            </TabsContent>
            
            {/* Timeline Tab */}
            <TabsContent value="timeline">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Event Timeline</CardTitle>
                    <CardDescription>Chronological flow of all events during the session</CardDescription>
                  </div>
                  {llmTrainingData && (
                    <Button variant="outline" size="sm" onClick={downloadLLMTrainingData}>
                      <Download className="h-4 w-4 mr-2" /> Download LLM Data
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    {timelineEvents.length > 0 ? (
                      <div className="pl-2">
                        {timelineEvents.map((event) => (
                          <TimelineEventItem key={event.id} event={event} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[300px]">
                        <p className="text-muted-foreground">No events to display in timeline</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights">
              <div className="grid grid-cols-1 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Advanced Interaction Insights</CardTitle>
                      <CardDescription>Detailed analysis of user behavior patterns</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {advancedAnalytics ? (
                      <div className="space-y-6">
                        {/* Timing Metrics */}
                        <div>
                          <h3 className="text-lg font-medium mb-2">Timing Metrics</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="bg-muted/30">
                              <CardContent className="p-4">
                                <div className="text-sm text-muted-foreground">Avg. Time Between Clicks</div>
                                <div className="text-2xl font-bold">
                                  {(advancedAnalytics.timingMetrics.averageTimeBetweenClicks / 1000).toFixed(2)}s
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="bg-muted/30">
                              <CardContent className="p-4">
                                <div className="text-sm text-muted-foreground">Avg. Time Between Keypresses</div>
                                <div className="text-2xl font-bold">
                                  {(advancedAnalytics.timingMetrics.averageTimeBetweenKeypresses / 1000).toFixed(2)}s
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="bg-muted/30">
                              <CardContent className="p-4">
                                <div className="text-sm text-muted-foreground">Total Active Time</div>
                                <div className="text-2xl font-bold">
                                  {(advancedAnalytics.timingMetrics.totalActiveTime / 1000).toFixed(0)}s
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="bg-muted/30">
                              <CardContent className="p-4">
                                <div className="text-sm text-muted-foreground">Total Idle Time</div>
                                <div className="text-2xl font-bold">
                                  {(advancedAnalytics.timingMetrics.totalIdleTime / 1000).toFixed(0)}s
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Focus Areas */}
                        <div>
                          <h3 className="text-lg font-medium mb-2">Top Focus Areas</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Element</TableHead>
                                <TableHead>Interactions</TableHead>
                                <TableHead>Time Spent</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {advancedAnalytics.focusAreas.map((area, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{area.element}</TableCell>
                                  <TableCell>{area.interactionCount}</TableCell>
                                  <TableCell>{(area.timeSpent / 1000).toFixed(1)}s</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Interaction Patterns */}
                        <div>
                          <h3 className="text-lg font-medium mb-2">Common Interaction Patterns</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Pattern</TableHead>
                                <TableHead>Count</TableHead>
                                <TableHead>Avg. Time Between</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {advancedAnalytics.interactionPatterns
                                .sort((a, b) => b.count - a.count)
                                .slice(0, 5)
                                .map((pattern, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{pattern.pattern}</TableCell>
                                    <TableCell>{pattern.count}</TableCell>
                                    <TableCell>{(pattern.averageTimeBetween / 1000).toFixed(2)}s</TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Navigation Flow */}
                        {advancedAnalytics.navigationFlow.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium mb-2">Navigation Flow</h3>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>From</TableHead>
                                  <TableHead>To</TableHead>
                                  <TableHead>Count</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {advancedAnalytics.navigationFlow.map((flow, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{flow.from || '(start)'}</TableCell>
                                    <TableCell>{flow.to}</TableCell>
                                    <TableCell>{flow.count}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[300px]">
                        <p className="text-muted-foreground">No advanced analytics available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Environment Tab */}
            <TabsContent value="environment">
              <Card>
                <CardHeader>
                  <CardTitle>Environment Information</CardTitle>
                  <CardDescription>Browser and system details</CardDescription>
                </CardHeader>
                <CardContent>
                  {metadata ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Browser</h3>
                        <p><strong>Name:</strong> {metadata.browser?.name}</p>
                        <p><strong>Version:</strong> {metadata.browser?.version}</p>
                        <p><strong>User Agent:</strong> {metadata.userAgent}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-2">System</h3>
                        <p><strong>Platform:</strong> {metadata.platform}</p>
                        <p><strong>Screen Resolution:</strong> {metadata.screenWidth}x{metadata.screenHeight}</p>
                        <p><strong>Window Size:</strong> {metadata.windowWidth}x{metadata.windowHeight}</p>
                      </div>

                      {mouseClickTargetData.length > 0 && (
                        <div className="col-span-2">
                          <h3 className="text-sm font-medium mb-2">Most Clicked Elements</h3>
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart
                              data={mouseClickTargetData}
                              margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <RechartsTooltip />
                              <Bar dataKey="value" fill="#8884d8" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[300px]">
                      <p className="text-muted-foreground">No environment data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Hidden container for replayer */}
      <div
        ref={containerRef}
        className="hidden"
        style={{ position: 'absolute', left: '-9999px', width: '1024px', height: '768px' }}
      />
    </>
  );
};

export default Analytics;
