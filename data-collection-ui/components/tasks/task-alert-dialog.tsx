"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Task } from "@/lib/task-data";
import { useTaskStatus } from "@/contexts/task-status-context";
import { InfoIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import { VscDebugStart } from "react-icons/vsc";
import { useRecording } from "@/utils/recordings/useRecording";

interface TaskAlertDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completionStatus: boolean;
}

export function TaskAlertDialog({
  task,
  open,
  onOpenChange,
  completionStatus,
}: TaskAlertDialogProps) {
  const { updateTaskStatus } = useTaskStatus();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleProceed = async () => {
    if (task) {
      setIsUpdating(true);
      await updateTaskStatus(task.id, "in-progress");
      setIsUpdating(false);
      window.open(`https://${task.website}`, "_blank");
      onOpenChange(false);
    }
  };

  const handleViewRecording = async () => {
    if (task) {
      setIsUpdating(true);
      await updateTaskStatus(task.id, "completed");
      setIsUpdating(false);
      onOpenChange(false);

      setTimeout(() => {
        router.push(`/dashboard/recordings?taskId=${task.id}`);
      }, 100);
    }
  };

  if (!task) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <InfoIcon className="h-5 w-5 text-amber-500" />
            Task Recording Guidelines
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-foreground flex flex-col">
            <span className="font-medium mb-2">{task.label}</span>
            <span className="text-sm text-muted-foreground mb-1">
              Website: {task.website}
            </span>
            <span className="text-sm text-muted-foreground mb-4">
              Average Duration: {task.averageDuration}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <div className="h-5 w-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-xs">
              !
            </div>
            <p>
              Do not waste time being inactive during the recording session.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-5 w-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-xs">
              !
            </div>
            <p>Do not navigate to any other site while recording this task.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-5 w-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-xs">
              !
            </div>
            <p>
              Do not perform any illegal actions or access inappropriate
              content.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-5 w-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-xs">
              !
            </div>
            <p>
              Return to this dashboard to mark the task as completed when
              finished.
            </p>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>

          {completionStatus ? (
            <AlertDialogAction
              onClick={handleViewRecording}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "View Recording"
              )}
            </AlertDialogAction>
          ) : (
            <AlertDialogAction onClick={handleProceed} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Proceed to Website"
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
