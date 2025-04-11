import type { EventWithScreenshots } from "./types";
import MouseClicksPanel from "./MouseClicksPanel";
import KeypressPanel from "./KeypressPanel";

interface InteractionsTabProps {
  mouseClickData: EventWithScreenshots[];
  keypressData: EventWithScreenshots[];
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  allEvents: any[];
  recordingStartTime: number;
}

const InteractionsTab: React.FC<InteractionsTabProps> = ({
  mouseClickData,
  keypressData,
  allEvents,
  recordingStartTime,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <MouseClicksPanel
        mouseClickData={mouseClickData}
        allEvents={allEvents}
        recordingStartTime={recordingStartTime}
      />
      <KeypressPanel
        keypressData={keypressData}
        allEvents={allEvents}
        recordingStartTime={recordingStartTime}
      />
    </div>
  );
};

export default InteractionsTab;
