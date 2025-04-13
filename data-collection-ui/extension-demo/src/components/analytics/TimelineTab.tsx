import { Download } from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import type { TimelineEvent, LLMTrainingData } from "./types";
import TimelineEventItem from "./TimelineEventItem";

interface TimelineTabProps {
  timelineEvents: TimelineEvent[];
  llmTrainingData: LLMTrainingData | null;
  onAnnotationUpdate: (eventId: string, annotation: string) => void;
  downloadLLMTrainingData: () => void;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  allEvents: any[];
  recordingStartTime?: number;
}

const TimelineTab: React.FC<TimelineTabProps> = ({
  timelineEvents,
  llmTrainingData,
  onAnnotationUpdate,
  downloadLLMTrainingData,
  allEvents,
  recordingStartTime,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Event Timeline</CardTitle>
          <CardDescription>
            Chronological flow of all events during the session
          </CardDescription>
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
                <TimelineEventItem
                  key={event.id}
                  event={event}
                  onAnnotationUpdate={onAnnotationUpdate}
                  allEvents={allEvents}
                  recordingStartTime={recordingStartTime}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">
                No events to display in timeline
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TimelineTab;
