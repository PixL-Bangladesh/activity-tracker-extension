"use client";

import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { TaskCategoryPanel } from "@/components/tasks/task-category-panel";
import { taskCategories } from "@/lib/task-data";
import { useTaskStatus } from "@/contexts/task-status-context";
import { useSearchParams } from "next/navigation";
import { useRecording } from "@/utils/recordings/useRecording";
import { deleteSession, getSessionAndEvents } from "@/utils/recordings/storage";
import { toast } from "sonner";
import { uploadFileToBucket } from "@/actions/bucket";
import { createClient } from "@/utils/supabase/client";

export default function TasksPage() {
  const { resetAllStatuses } = useTaskStatus();
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  console.log("categoryParam", categoryParam);
  const { isRecording, start, stop } = useRecording();

  // Ensure we only render after hydration to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter categories based on search query
  const filteredCategories = taskCategories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.tasks.some((task) =>
        task.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  const handleStartRecording = async () => {
    start(`Session-${new Date().toISOString()}`);
  };

  const handleStopRecording = async () => {
    try {
      const result = await stop();
      if (result) {
        // Refresh sessions list by adding the new session
        const inRecordingTaskId = localStorage.getItem("inRecordingTaskId");
        const sessionBlob = await getSessionAndEvents(result.session.id);
        const supabase = createClient();
        const user = (await supabase.auth.getUser()).data.user;
        const uploadData = await uploadFileToBucket({
          bucketName: "recordings",
          filePath: `${user?.email}/${inRecordingTaskId}.json`,
          file: sessionBlob,
        });
        await deleteSession(result.session.id);
        if (uploadData.error) {
          throw new Error(uploadData.error.message);
        }
        toast.success("Recording stopped and uploaded successfully.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Error stopping recording: ${message}`);
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4 lg:px-8">
            <h1 className="text-xl font-semibold">Tasks</h1>
            <div className="ml-auto flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search tasks..."
                  className="w-[200px] lg:w-[300px] pl-8 bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={resetAllStatuses}>
                Reset Progress
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {/* <div className="flex items-center gap-2 mb-5">
            {isRecording ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleStopRecording}
              >
                Stop Recording
              </Button>
            ) : (
              <Button size="sm" onClick={() => handleStartRecording()}>
                Start Recording
              </Button>
            )}
          </div> */}

          <div className="space-y-4">
            {filteredCategories.map((category) => (
              <TaskCategoryPanel
                key={category.id}
                category={category}
                defaultOpen={categoryParam === category.id}
              />
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
