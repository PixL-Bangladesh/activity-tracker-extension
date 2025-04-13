import { useState, useEffect } from 'react';
import Browser from 'webextension-polyfill';
import { ListIcon, Settings, Pause, Play } from 'lucide-react';
import Channel from '~/utils/channel';
import { LocalDataKey, RecorderStatus, EventName } from '~/types';
import type { LocalData, Session } from '~/types';

import { CircleButton } from '~/components/ui/circle-button';
import { Timer } from '~/components/ui/timer';
import { Button } from '~/components/ui/button';

const RECORD_BUTTON_SIZE = 3;
const channel = new Channel();

export function App() {
  const [status, setStatus] = useState<RecorderStatus>(RecorderStatus.IDLE);
  const [errorMessage, setErrorMessage] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [newSession, setNewSession] = useState<Session | null>(null);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    const parseStatusData = (data: LocalData[LocalDataKey.recorderStatus]) => {
      const { status, startTimestamp, pausedTimestamp } = data;
      setStatus(status);
      if (startTimestamp && pausedTimestamp)
        setStartTime(Date.now() - pausedTimestamp + startTimestamp);
      else if (startTimestamp) setStartTime(startTimestamp);
    };
    void Browser.storage.local.get(LocalDataKey.recorderStatus).then((data) => {
      if (!data || !data[LocalDataKey.recorderStatus]) return;
      parseStatusData((data as LocalData)[LocalDataKey.recorderStatus]);
    });
    void Browser.storage.local.onChanged.addListener((changes) => {
      if (!changes[LocalDataKey.recorderStatus]) return;
      const data = changes[LocalDataKey.recorderStatus]
        .newValue as LocalData[LocalDataKey.recorderStatus];
      parseStatusData(data);
      if (data.errorMessage) setErrorMessage(data.errorMessage);
    });
    channel.on(EventName.SessionUpdated, (data) => {
      setNewSession((data as { session: Session }).session);
    });

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && typeof event.reason.message === 'string' &&
        (event.reason.message.includes("Could not establish connection") ||
          event.reason.message.includes("Receiving end does not exist"))) {
        setConnectionError(true);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const safeEmit = async (eventName: EventName, data: unknown) => {
    try {
      await channel.emit(eventName, data);
    } catch (error) {
      if (error instanceof Error &&
        (error.message.includes("Could not establish connection") ||
          error.message.includes("Receiving end does not exist"))) {
        setConnectionError(true);
      }
    }
  };

  const handleRecordingAction = (action: string) => {
    try {
      if (action === 'start' && status === RecorderStatus.IDLE) {
        void safeEmit(EventName.StartButtonClicked, {})
      } else if (action === 'stop') {
        void safeEmit(EventName.StopButtonClicked, {})
      } else if (action === 'pause' && status === RecorderStatus.RECORDING) {
        void safeEmit(EventName.PauseButtonClicked, {})
      } else if (action === 'resume') {
        void safeEmit(EventName.ResumeButtonClicked, {})
      }
    } catch (error) {
      if (error instanceof Error &&
        (error.message.includes("Could not establish connection") ||
          error.message.includes("Receiving end does not exist"))) {
        setConnectionError(true);
      }
    }
  };

  return (
    <div className="flex flex-col w-[300px] h-[300px] p-[5%]">
      <div className="flex">
        <p className="text-md font-bold">
          ScreenTrail Recorder
        </p>
        <div className="flex-1" />
        <div className="flex flex-row space-x-2">
          <Button
            onClick={() => {
              void Browser.tabs.create({ url: '/pages/index.html#/' });
            }}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="Session List"
          >
            <ListIcon className="h-4 w-4" />
            <span className="sr-only">Session List</span>
          </Button>
          <Button
            onClick={() => {
              void Browser.runtime.openOptionsPage();
            }}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </div>

      {status !== RecorderStatus.IDLE && startTime && (
        <Timer
          startTime={startTime}
          ticking={status === RecorderStatus.RECORDING}
        />
      )}

      <div className="flex justify-center gap-10 mt-5 mb-5">
        <CircleButton
          diameter={RECORD_BUTTON_SIZE}
          title={
            status === RecorderStatus.IDLE
              ? 'Start Recording'
              : 'Stop Recording'
          }
          onClick={() => handleRecordingAction(status === RecorderStatus.IDLE ? 'start' : 'stop')}
        >
          <div
            style={{
              width: `${RECORD_BUTTON_SIZE}rem`,
              height: `${RECORD_BUTTON_SIZE}rem`,
              margin: 0,
              backgroundColor: 'rgb(239, 68, 68)', // red-500
              borderRadius: status === RecorderStatus.IDLE ? '9999px' : '0.375rem'
            }}
          />
        </CircleButton>

        {status !== RecorderStatus.IDLE && (
          <CircleButton
            diameter={RECORD_BUTTON_SIZE}
            title={
              status === RecorderStatus.RECORDING
                ? 'Pause Recording'
                : 'Resume Recording'
            }
            onClick={() => handleRecordingAction(status === RecorderStatus.RECORDING ? 'pause' : 'resume')}
          >
            <div
              style={{
                width: `${RECORD_BUTTON_SIZE}rem`,
                height: `${RECORD_BUTTON_SIZE}rem`,
                borderRadius: '9999px',
                margin: 0,
                color: 'rgb(75, 85, 99)' // gray-600
              }}
            >
              {[RecorderStatus.PAUSED, RecorderStatus.PausedSwitch].includes(
                status,
              ) && (
                  <Play
                    className="pl-2 w-full h-full"
                  />
                )}
              {status === RecorderStatus.RECORDING && (
                <Pause
                  className="w-full h-full"
                />
              )}
            </div>
          </CircleButton>
        )}
      </div>

      {newSession && (
        <div className="flex flex-col mt-2 p-4 rounded-md border border-gray-200">
          <p className="text-sm font-medium">
            New session created
          </p>
          <Button
            onClick={() => {
              void Browser.tabs.create({
                url: `/pages/index.html#/player/${newSession.id}`,
              });
              setNewSession(null);
            }}
            className="mt-2"
            variant="outline"
            size="sm"
          >
            View Session
          </Button>
        </div>
      )}

      {errorMessage && (
        <div className="mt-2 p-4 rounded-md border border-red-200 bg-red-50">
          <p className="text-sm text-red-600">
            {errorMessage}
          </p>
        </div>
      )}

      {connectionError && (
        <div className="mt-2 p-4 rounded-md border border-red-200 bg-red-50">
          <p className="text-sm text-red-600 mb-2">
            Could not establish connection. The page may need to be refreshed.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-100"
            onClick={() => {
              // Attempt to refresh the active tab
              Browser.tabs.query({ active: true, currentWindow: true })
                .then(tabs => {
                  if (tabs[0]?.id) {
                    return Browser.tabs.reload(tabs[0].id);
                  }
                })
                .then(() => {
                  setConnectionError(false);
                })
                .catch(() => {
                  // If we can't reload the tab, at least reset the error state
                  setConnectionError(false);
                });
            }}
          >
            Refresh Page
          </Button>
        </div>
      )}
    </div>
  );
}
