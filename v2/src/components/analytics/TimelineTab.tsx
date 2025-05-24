import type React from "react";
import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { PenLine, Save, CheckCircle, X } from "lucide-react";
import { getNetworkDescription } from "./utils";
import EventVisualization from "./EventVisualization";
import type { AIAgentTrainingData, TaskExample, Step } from "./extraction";
import type { EventWithScreenshots } from "./types";

interface TimelineTabProps {
  structuredData?: AIAgentTrainingData;
  networkData: EventWithScreenshots[];
  // biome-ignore lint/suspicious/noExplicitAny: using type from original code
  allEvents: any[];
  recordingStartTime: number;
}

// List of meaningful action types to keep
const MEANINGFUL_INTERACTIONS = [
  "click",
  "fill",
  "select",
  "navigate",
  "submit",
  "contextmenu",
  "play",
  "pause",
  "network",
];

const TimelineTab: React.FC<TimelineTabProps> = ({
  structuredData,
  networkData,
  allEvents,
  recordingStartTime,
}) => {
  const [filterType, setFilterType] = useState<string | null>(null);
  const [userInstructions, setUserInstructions] = useState<{
    [key: string]: string;
  }>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentInstruction, setCurrentInstruction] = useState<string>("");

  // Combine all events from structured data and network data
  const timelineEvents = useMemo(() => {
    const events: {
      id: string;
      timestamp: number;
      relativeTime: number;
      type: string;
      description: string;
      // biome-ignore lint/suspicious/noExplicitAny: varied data types
      data: any;
      source: "agent" | "network";
      userInstruction?: string;
    }[] = [];

    // Add events from structuredData, filtering for meaningful interactions only
    if (structuredData?.task_examples) {
      // biome-ignore lint/complexity/noForEach: <explanation>
      structuredData.task_examples.forEach((task: TaskExample) => {
        // biome-ignore lint/complexity/noForEach: <explanation>
        task.steps.forEach((step: Step) => {
          // Only include meaningful interactions
          if (MEANINGFUL_INTERACTIONS.includes(step.action)) {
            events.push({
              id: `step-${step.step_id}-${Date.now()}`,
              timestamp: recordingStartTime + step.timestamp.relative_ms,
              relativeTime: step.timestamp.relative_ms,
              type: step.action,
              description: `${step.action} ${step.element_type || "element"}${
                step.value ? `: ${step.value}` : ""
              }`,
              data: step,
              source: "agent",
            });
          }
        });
      });
    }

    // Add important network events
    // biome-ignore lint/complexity/noForEach: <explanation>
    networkData.forEach((event) => {
      // Filter to include only important network requests (non-asset requests)
      const url = event.data.url || "";
      const isImportantRequest =
        !url.match(/\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf|map)$/i) ||
        url.includes("/api/") ||
        url.includes("/graphql");

      if (isImportantRequest) {
        events.push({
          id: event.id,
          timestamp: event.timestamp,
          relativeTime: event.relativeTime,
          type: "network",
          description: getNetworkDescription(event.data),
          data: event.data,
          source: "network",
        });
      }
    });

    // Sort all events by timestamp
    return events.sort((a, b) => a.timestamp - b.timestamp);
  }, [structuredData, networkData, recordingStartTime]);

  // Filter events based on selected type
  const filteredEvents = useMemo(() => {
    if (!filterType) return timelineEvents;
    return timelineEvents.filter((event) => event.type === filterType);
  }, [timelineEvents, filterType]);

  // Get unique event types for filter
  const eventTypes = useMemo(() => {
    const types = new Set<string>();
    // biome-ignore lint/complexity/noForEach: <explanation>
    timelineEvents.forEach((event) => types.add(event.type));
    return Array.from(types);
  }, [timelineEvents]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Create a screenshot-compatible event object for the EventVisualization
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const createScreenshotEvent = (event: any): EventWithScreenshots => {
    // For network events, find the actual network event
    if (event.source === "network") {
      const matchingNetworkEvent = networkData.find((n) => n.id === event.id);
      if (matchingNetworkEvent) {
        return matchingNetworkEvent;
      }
    }

    // For agent events (clicks, fills, etc.), create a compatible event object
    return {
      id: event.id,
      type: event.type,
      timestamp: event.timestamp,
      relativeTime: event.relativeTime,
      beforeScreenshot: null, // These will be generated by EventVisualization
      afterScreenshot: null,
      data: event.data,
    };
  };

  const startEditing = (id: string, currentValue = "") => {
    setEditingId(id);
    setCurrentInstruction(currentValue);
  };

  const saveInstruction = (id: string) => {
    setUserInstructions({
      ...userInstructions,
      [id]: currentInstruction,
    });
    setEditingId(null);
    setCurrentInstruction("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setCurrentInstruction("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
        <CardDescription>
          Chronological view of meaningful user interactions and important
          network requests
        </CardDescription>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge
            className="cursor-pointer"
            variant={filterType === null ? "default" : "outline"}
            onClick={() => setFilterType(null)}
          >
            All Events ({timelineEvents.length})
          </Badge>
          {eventTypes.map((type) => (
            <Badge
              key={type}
              className="cursor-pointer"
              variant={filterType === type ? "default" : "outline"}
              onClick={() => setFilterType(type === filterType ? null : type)}
            >
              {type} ({timelineEvents.filter((e) => e.type === type).length})
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[700px] pr-4">
          {filteredEvents.length > 0 ? (
            <div className="space-y-8">
              {filteredEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="relative pb-8 border-l-2 border-gray-200 pl-6"
                >
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-[5px] h-3 w-3 rounded-full ${
                      event.source === "agent" ? "bg-blue-500" : "bg-green-500"
                    }`}
                  />

                  {/* Time indicator */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold bg-gray-100 px-2 py-0.5 rounded">
                      {formatTime(event.relativeTime)}
                    </span>
                    <Badge
                      variant={
                        event.source === "agent" ? "secondary" : "default"
                      }
                    >
                      {event.type}
                    </Badge>
                  </div>

                  {/* Event description */}
                  <div className="mb-3">
                    <h3 className="text-md font-medium">{event.description}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.source === "network" ? (
                        <>
                          {event.data.method}{" "}
                          {event.data.status && `(${event.data.status})`}
                        </>
                      ) : (
                        <>
                          {event.data.element_id ||
                            event.data.selector ||
                            "No details"}
                        </>
                      )}
                    </p>
                  </div>

                  {/* User instruction - edit/display */}
                  <div className="mb-4">
                    {editingId === event.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Enter a description of what's happening here..."
                          value={currentInstruction}
                          onChange={(e) =>
                            setCurrentInstruction(e.target.value)
                          }
                          className="flex-1"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => saveInstruction(event.id)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={cancelEditing}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {userInstructions[event.id] ? (
                          <div className="flex-1 bg-muted p-2 rounded-md text-sm">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                              <CheckCircle className="h-3 w-3" /> User
                              instruction
                            </span>
                            {userInstructions[event.id]}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Add a description of what's happening in this
                            step...
                          </span>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            startEditing(
                              event.id,
                              userInstructions[event.id] || ""
                            )
                          }
                        >
                          <PenLine className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Event visualization */}
                  <div className="border rounded-md overflow-hidden">
                    <EventVisualization
                      event={createScreenshotEvent(event)}
                      events={allEvents}
                      recordingStartTime={recordingStartTime}
                      showController={false}
                    />
                  </div>

                  {/* Last item doesn't need connector */}
                  {index !== filteredEvents.length - 1 && (
                    <div className="absolute bottom-0 -left-[5px] h-[10px] w-[10px]" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">
                No meaningful events to display
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TimelineTab;
