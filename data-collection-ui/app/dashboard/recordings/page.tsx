"use client";

import type React from "react";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { taskCategories } from "@/lib/task-data";
import Script from "next/script";
import Replayer from "rrweb-player";
import { getReplayConsolePlugin } from "@rrweb/rrweb-plugin-console-replay";
import type { Session } from "@/types/Session";
import type { eventWithTime } from "rrweb";
import { downloadFileFromBucket } from "@/actions/bucket";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { printIfDev } from "@/utils/development/debug";
import type { TaskEventBucketType } from "@/types/tasks";

interface SessionData {
  session: Session;
  events: eventWithTime[];
}

export default function RecordingPage() {
  const params = useSearchParams();
  const taskId = params.get("taskId") as string;
  const playerElRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Replayer | null>(null);
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const [task, setTask] = useState<any>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerLoaded, setPlayerLoaded] = useState(false);
  const supabase = createClient();

  // Find the task
  useEffect(() => {
    if (!taskId) return;

    for (const category of taskCategories) {
      const foundTask = category.tasks.find((t) => t.id === taskId);
      if (foundTask) {
        setTask({
          ...foundTask,
          category: category.name,
        });
        break;
      }
    }
  }, [taskId]);

  // Initialize player when session data is available
  useEffect(() => {
    if (!sessionData || !playerElRef.current || !playerLoaded) return;

    // Clear previous player
    if (playerElRef.current) {
      playerElRef.current.innerHTML = "";
    }

    try {
      playerRef.current = new Replayer({
        target: playerElRef.current,
        props: {
          events: sessionData.events,
          autoPlay: true,
          plugins: [
            getReplayConsolePlugin({
              level: ["info", "log", "warn", "error"],
            }),
          ],
        },
      });
    } catch (err) {
      console.error("Failed to initialize player:", err);
      setError("Failed to initialize player. Please try again.");
    }
  }, [playerLoaded, sessionData]);

  const fetchRecordingData = async () => {
    try {
      setIsLoading(true);
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data, error } = await downloadFileFromBucket({
        bucketName: "recordings",
        filePath: `${userId}/${taskId}.json`,
      });

      printIfDev({ errorObject: data });

      if (error) {
        toast.error("Failed to fetch recording data. Please try again.", {
          description: error.message,
        });

        printIfDev(error);

        setError("Failed to fetch recording data. Please try again.");
        return;
      }

      // turn blob to json
      if (data) {
        try {
          const jsonText = await data.text();
          const jsonData = JSON.parse(jsonText) as TaskEventBucketType;

          setSessionData({
            session: jsonData.session,
            events: jsonData.events,
          });

          printIfDev({
            errorObject: jsonData,
          });
        } catch (parseError) {
          console.error("Failed to parse JSON data:", parseError);
          toast.error("Failed to parse recording data", {
            description:
              "The recording file appears to be corrupted or in an invalid format.",
          });
          setError(
            "Failed to parse recording data. The file may be corrupted."
          );
        }
      }
    } catch (error) {
      const _error =
        error instanceof Error ? error : new Error("Unknown error");
      toast.error("An error occured while fetching the data from the bucket", {
        description: _error.message,
      });
      setError("Failed to fetch recording data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!taskId) return;
    fetchRecordingData();
  }, [taskId]);

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/rrweb-player@latest/dist/index.js"
        onLoad={() => setPlayerLoaded(true)}
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/rrweb-player@2.0.0-alpha.18/dist/style.css"
      />

      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4 lg:px-8">
            <h1 className="text-xl font-semibold">
              Recording Player
              <span className="text-sm text-muted-foreground ml-2">
                (Refresh the page if the player does not function properly)
              </span>
            </h1>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {task ? (
            <div className="max-w-5xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">{task.label}</h2>
                <p className="text-muted-foreground">
                  {task.category} • {task.website} • {task.averageDuration}
                </p>
              </div>

              {sessionData ? (
                <div className="space-y-4">
                  <Card className="bg-background border-none">
                    <CardHeader>
                      <CardTitle>{sessionData.session.name}</CardTitle>
                      <CardDescription>
                        Recorded on{" "}
                        {new Date(
                          sessionData.session.createTimestamp
                        ).toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                      <div ref={playerElRef} className="" />
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div>
                  {/* loading */}
                  <p className="text-center text-muted-foreground">
                    Loading session data...
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-3xl font-bold text-chart-5">Task not found</p>
              <p>Please redirect to this page from Tasks Panel</p>
              <p className="text-muted-foreground">
                If you continue to see this message, please check your session.
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
