import type { eventWithTime } from '@rrweb/types';

export enum SyncDataKey {
  settings = 'settings',
}

export type SyncData = {
  [SyncDataKey.settings]: Settings;
};

export type Settings = {
  //
};

export enum LocalDataKey {
  recorderStatus = 'recorder_status',
}

export type LocalData = {
  [LocalDataKey.recorderStatus]: {
    status: RecorderStatus;
    activeTabId: number;
    startTimestamp?: number;
    // the timestamp when the recording is paused
    pausedTimestamp?: number;
    errorMessage?: string; // error message when recording failed
  };
};

export enum RecorderStatus {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PAUSED = 'PAUSED',
  // when user change the tab, the recorder will be paused during the tab change
  PausedSwitch = 'PAUSED_SWITCH',
}

export type Session = {
  id: string;
  name: string;
  tags: string[];
  createTimestamp: number;
  modifyTimestamp: number;
  recorderVersion: string;
};

// all service names for channel
export enum ServiceName {
  StartRecord = 'start-record',
  StopRecord = 'stop-record',
}

// all event names for channel
export enum EventName {
  SessionUpdated = 'session-updated',
  ContentScriptEmitEvent = 'content-script-emit-event',
  StartButtonClicked = 'start-recording-button-clicked',
  StopButtonClicked = 'stop-recording-button-clicked',
  PauseButtonClicked = 'pause-recording-button-clicked',
  ResumeButtonClicked = 'resume-recording-button-clicked',
}

// all message names for postMessage API
export enum MessageName {
  RecordScriptReady = 'ScreenTrail-extension-record-script-ready',
  StartRecord = 'ScreenTrail-extension-start-record',
  RecordStarted = 'ScreenTrail-extension-record-started',
  StopRecord = 'ScreenTrail-extension-stop-record',
  RecordStopped = 'ScreenTrail-extension-record-stopped',
  EmitEvent = 'ScreenTrail-extension-emit-event',
}

export type RecordStartedMessage = {
  message: MessageName.RecordStarted;
  startTimestamp: number;
};

export type RecordStoppedMessage = {
  message: MessageName.RecordStopped;
  endTimestamp: number;
};

export type EmitEventMessage = {
  message: MessageName.EmitEvent;
  event: eventWithTime;
};
