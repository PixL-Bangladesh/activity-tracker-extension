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

interface KeypressPanelProps {
  keypressData: EventWithScreenshots[];
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  allEvents: any[];
  recordingStartTime: number;
}

const KeypressPanel: React.FC<KeypressPanelProps> = ({
  keypressData,
  allEvents,
  recordingStartTime,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Keypresses</CardTitle>
        <CardDescription>
          All captured keypresses during the session
        </CardDescription>
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
                {keypressData.map((keypress) => (
                  <TableRow key={keypress.id}>
                    <TableCell>
                      <Badge>{keypress.data.key}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{keypress.data.target}</Badge>
                    </TableCell>
                    <TableCell>
                      {keypress.data.isMetaKey ? "Yes" : "No"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(keypress.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <EventScreenshotDialog
                        event={keypress}
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
              <p className="text-muted-foreground">No keypresses captured</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default KeypressPanel;
