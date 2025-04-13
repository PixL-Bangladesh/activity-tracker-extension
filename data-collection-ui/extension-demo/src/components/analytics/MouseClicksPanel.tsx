import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { ScrollArea } from "~/components/ui/scroll-area";
import type { EventWithScreenshots } from "./types";
import EventScreenshotDialog from "./EventScreenshotDialog";

interface MouseClicksPanelProps {
  mouseClickData: EventWithScreenshots[];
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  allEvents: any[];
  recordingStartTime: number;
}

const MouseClicksPanel: React.FC<MouseClicksPanelProps> = ({
  mouseClickData,
  allEvents,
  recordingStartTime,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mouse Clicks</CardTitle>
        <CardDescription>
          All captured mouse clicks during the session
        </CardDescription>
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
                  <TableHead>Video</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mouseClickData.map((click) => (
                  <TableRow key={click.id}>
                    <TableCell>
                      <Badge variant="outline">{click.data.target}</Badge>
                    </TableCell>
                    <TableCell>
                      {click.data.x}, {click.data.y}
                    </TableCell>
                    <TableCell>
                      {click.data.button === 0
                        ? "Left"
                        : click.data.button === 1
                        ? "Middle"
                        : click.data.button === 2
                        ? "Right"
                        : click.data.button}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(click.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <EventScreenshotDialog
                        event={click}
                        events={allEvents}
                        recordingStartTime={recordingStartTime}
                      />
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
  );
};

export default MouseClicksPanel;
