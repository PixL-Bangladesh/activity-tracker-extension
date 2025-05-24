import { useEffect, useRef, useState } from "react";
import RRWebPlayer from "rrweb-player";
import "rrweb-player/dist/style.css";
import type { EventWithScreenshots } from "./types";

interface EventVisualizationProps {
  event: EventWithScreenshots;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  events: any[]; // All session events
  recordingStartTime: number;
  showController?: boolean;
}

const EventVisualization: React.FC<EventVisualizationProps> = ({
  event,
  events,
  recordingStartTime,
  showController,
}) => {
  const visualizationRef = useRef<HTMLDivElement>(null);
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize replayer when dialog opens
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (visualizationRef.current && events.length > 0 && !playerRef.current) {
      try {
        // Create a new player instance
        playerRef.current = new RRWebPlayer({
          target: visualizationRef.current,
          props: {
            events: events,
            autoPlay: false,
            showController: showController,
            width: 800,
            height: 450,
            skipInactive: true,
            speedOption: [1, 2, 4, 8],
            // Use string values for tags as required by the type
            tags: {
              network: "#3498db",
              mouseClick: "#e74c3c",
              keypress: "#2ecc71",
            },
          },
        });

        // Jump to the timestamp of the event (slightly before)
        const beforeTime = Math.max(0, event.timestamp - recordingStartTime);
        setTimeout(() => {
          if (playerRef.current) {
            playerRef.current.getReplayer().play(beforeTime);
            playerRef.current.getReplayer().pause();
            setIsReady(true);
          }
        }, 500);

        return () => {
          // Clean up
          if (playerRef.current) {
            // Use the proper destroy method
            if (typeof playerRef.current.$destroy === "function") {
              playerRef.current.$destroy();
            }
            playerRef.current = null;
          }
        };
      } catch (error) {
        console.error("Error creating visualization player:", error);
      }
    }
  }, [visualizationRef.current, event.timestamp, events]);

  return (
    <div className="grid grid-cols-1 gap-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Event Visualization</h3>
        <div className="flex justify-center h-[500px] overflow-auto">
          <div ref={visualizationRef} className="border rounded-md bg-gray-50">
            {!isReady && (
              <div className="flex items-center justify-center h-[500px] w-[800px]">
                <p className="text-muted-foreground">
                  Loading visualization...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Event Details</h3>
        <div className="bg-muted p-4 rounded-md">
          <div className="mb-2">
            <span className="font-semibold">Time:</span>{" "}
            {new Date(event.timestamp).toLocaleTimeString()}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Type:</span>{" "}
            {event.id.split("-")[0]}
          </div>
          <pre className="text-xs font-mono bg-gray-100 h-[100px] p-2 rounded overflow-auto">
            {JSON.stringify(event.data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default EventVisualization;
