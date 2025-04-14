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
import { Upload } from "lucide-react";
import { taskCategories } from "@/lib/task-data";
import Script from "next/script";
import Replayer from "rrweb-player";
import { getReplayConsolePlugin } from "@rrweb/rrweb-plugin-console-replay";

interface SessionData {
  session: {
    id: string;
    name: string;
    tags: string[];
    createTimestamp: number;
    modifyTimestamp: number;
    recorderVersion: string;
  };
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  events: any[];
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
  }, [sessionData, playerLoaded]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        setSessionData(jsonData);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to parse JSON:", err);
        setError("Invalid JSON file. Please upload a valid recording file.");
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file. Please try again.");
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

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

              {!sessionData ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Recording</CardTitle>
                    <CardDescription>
                      Upload a JSON file containing the session recording data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-lg">
                      <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                      <p className="mb-4 text-center text-muted-foreground">
                        Drag and drop your recording JSON file here, or click to
                        browse
                      </p>
                      <label className="cursor-pointer">
                        <input
                          id="recording-file"
                          name="recording-file"
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={isLoading}
                        />
                        <Button
                          disabled={isLoading}
                          onClick={() =>
                            document.getElementById("recording-file")?.click()
                          }
                        >
                          {isLoading ? "Processing..." : "Select File"}
                        </Button>
                      </label>
                      {error && <p className="mt-4 text-red-500">{error}</p>}
                    </div>
                  </CardContent>
                </Card>
              ) : (
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

                  <Button
                    variant="outline"
                    onClick={() => setSessionData(null)}
                    className="mt-4"
                  >
                    Upload Different Recording
                  </Button>
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
