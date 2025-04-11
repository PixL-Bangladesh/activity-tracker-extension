import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import type { TimelineEvent } from "./types";
import { truncateString } from "./utils";
import EventScreenshotDialog from "./EventScreenshotDialog";

interface TimelineEventItemProps {
  event: TimelineEvent;
  onAnnotationUpdate: (eventId: string, annotation: string) => void;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  allEvents: any[];
  recordingStartTime?: number;
}

const TimelineEventItem: React.FC<TimelineEventItemProps> = ({
  event,
  onAnnotationUpdate,
  allEvents,
  recordingStartTime,
}) => {
  const [annotation, setAnnotation] = useState(event.userAnnotation || "");
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveAnnotation = () => {
    onAnnotationUpdate(event.id, annotation);
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
      <div className="absolute left-4 top-0 bottom-0 w-px bg-muted-foreground/20 -z-10" />

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
              onKeyUp={(e) => {
                if (e.key === "Enter") {
                  setIsEditing(true);
                }
              }}
            >
              <span className="text-sm text-muted-foreground italic">
                {event.userAnnotation
                  ? `"${event.userAnnotation}"`
                  : "Click to add your intention for this action..."}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                {event.userAnnotation ? "Edit" : "Add"}
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
                if (typeof value === "object" || Array.isArray(value))
                  return null;
                return (
                  <div key={key} className="flex">
                    <span className="font-medium mr-2">{key}:</span>
                    <span className="text-muted-foreground">
                      {String(value)}
                    </span>
                  </div>
                );
              })}

              {/* Show additional extracted details */}
              {additionalDetails.length > 0 && (
                <div className="mt-2 pt-2 border-t border-muted">
                  <p className="font-medium mb-1">Additional Details:</p>
                  {additionalDetails.map((detail) => (
                    <div key={detail} className="text-muted-foreground">
                      {detail}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Screenshot section  */}
        <EventScreenshotDialog
          event={event as any}
          events={allEvents}
          recordingStartTime={recordingStartTime}
        />
      </div>
    </div>
  );
};

export default TimelineEventItem;
