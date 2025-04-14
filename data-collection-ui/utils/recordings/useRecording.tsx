// useRecording.ts - React hook for recording management

import { useState, useEffect, useCallback } from "react";
import { startRecording, stopRecording, isRecordingActive } from "./recording";
import { addSession } from "./storage"; // Changed from saveSession to addSession
import { nanoid } from "nanoid"; // or use any UUID generator

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [currentSession, setCurrentSession] = useState<{
    id: string;
    name: string;
    startTime: number;
  } | null>(null);
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const [events, setEvents] = useState<any[]>([]);

  // Start recording with optional session name
  const start = useCallback((sessionName = "Untitled Session") => {
    if (isRecordingActive()) return;

    const sessionId = nanoid();
    const startTime = Date.now();

    // Create a new session
    setCurrentSession({
      id: sessionId,
      name: sessionName,
      startTime,
    });

    // Start recording with event callback
    startRecording({
      onEvent: (event) => {},
    });

    setIsRecording(true);

    return { sessionId, startTime };
  }, []);

  // Stop recording
  const stop = useCallback(async () => {
    if (!isRecordingActive() || !currentSession) return null;

    const result = stopRecording();
    if (!result) return null;

    setIsRecording(false);

    // Create session object
    const session = {
      id: currentSession.id,
      name: currentSession.name,
      tags: [],
      createTimestamp: currentSession.startTime,
      modifyTimestamp: Date.now(),
      recorderVersion: "1.0.0", // Use your app version
    };

    // Save session and events
    await addSession(session, result.events); // Changed from saveSession to addSession

    // Reset state
    setCurrentSession(null);
    setEvents([]);

    return {
      session,
      events: result.events,
      duration: result.endTimestamp - currentSession.startTime,
    };
  }, [currentSession]);

  // Clean up if needed
  useEffect(() => {
    return () => {
      if (isRecordingActive()) {
        stopRecording();
      }
    };
  }, []);

  return {
    isRecording,
    currentSession,
    events,
    start,
    stop,
  };
}
