import type React from "react";
import { Eye } from "lucide-react";
import type { EventWithScreenshots } from "./types";
import EventVisualization from "./EventVisualization";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

interface EventScreenshotDialogProps {
  event: EventWithScreenshots;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  events: any[]; // All session events
  recordingStartTime: number;
}

const EventScreenshotDialog: React.FC<EventScreenshotDialogProps> = ({
  event,
  events,
  recordingStartTime,
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-1" /> View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Event at {new Date(event.timestamp).toLocaleTimeString()}
          </DialogTitle>
        </DialogHeader>
        <EventVisualization
          event={event}
          events={events}
          recordingStartTime={recordingStartTime}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EventScreenshotDialog;
