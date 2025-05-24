import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { Session } from "~/types";
import { getSession, getEvents } from "~/utils/storage";
import { Skeleton } from "~/components/ui/skeleton";
import { Replayer } from "rrweb";

// Import modular components
import NetworkTab from "~/components/analytics/NetworkTab";
import TimelineTab from "~/components/analytics/TimelineTab";

// Import types
import type { EventWithScreenshots } from "~/components/analytics/types";
import {
  extractStructuredData,
  type AIAgentTrainingData,
} from "~/components/analytics/extraction";

// Import utilities

const Analytics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const replayerRef = useRef<Replayer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Data structures for analytics
  const [networkData, setNetworkData] = useState<EventWithScreenshots[]>([]);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [structuredData, setStructuredData] = useState<AIAgentTrainingData>();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const sessionData = await getSession(id);
        const eventsData = await getEvents(id);

        setSession(sessionData as Session);
        setAllEvents(eventsData);
        const tempStructuredData = extractStructuredData(eventsData);
        setStructuredData(tempStructuredData);

        // Find the start and end timestamps from events
        if (eventsData && eventsData.length > 0) {
          const startTime = eventsData[0].timestamp;
          const endTime = eventsData[eventsData.length - 1].timestamp;
          setRecordingStartTime(startTime);
          setRecordingDuration(Math.round((endTime - startTime) / 1000));
        }

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

      // Process each event type
      for (let i = 0; i < allEvents.length; i++) {
        const event = allEvents[i];

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
          }
        }
      }

      // Update state with processed data
      setNetworkData(processedNetworkData);
    } catch (error) {
      console.error("Error processing interaction events:", error);
    }
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
            <TabsList className="grid grid-cols-8 mb-4">
              <TabsTrigger value="network">
                Network ({networkData.length})
              </TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            {/* Network Tab */}
            <TabsContent value="network">
              <NetworkTab
                networkData={networkData}
                allEvents={allEvents}
                recordingStartTime={recordingStartTime}
              />
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline">
              <TimelineTab
                structuredData={structuredData}
                networkData={networkData}
                allEvents={allEvents}
                recordingStartTime={recordingStartTime}
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
