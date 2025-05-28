import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EventWithScreenshots } from "./types";
import EventScreenshotDialog from "./EventScreenshotDialog";

interface NetworkTabProps {
  networkData: EventWithScreenshots[];
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  allEvents: any[];
  recordingStartTime?: number;
}

const NetworkTab: React.FC<NetworkTabProps> = ({
  networkData,
  allEvents,
  recordingStartTime,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Network Requests</CardTitle>
        <CardDescription>
          All captured network requests during the session
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
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
                {networkData.map((request: any) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-xs truncate max-w-[300px]">
                      {request.data.url}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          request.data.method === "GET"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {request.data.method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {typeof request.data.status === "number" ? (
                        <Badge
                          variant={
                            request.data.status >= 200 &&
                            request.data.status < 300
                              ? "default"
                              : request.data.status >= 300 &&
                                request.data.status < 400
                              ? "secondary"
                              : "destructive"
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
                      {request.data.duration
                        ? `${request.data.duration}ms`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <EventScreenshotDialog
                        event={request}
                        events={allEvents}
                        recordingStartTime={Number(recordingStartTime)}
                        showController={false}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">
                No network requests captured
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NetworkTab;
