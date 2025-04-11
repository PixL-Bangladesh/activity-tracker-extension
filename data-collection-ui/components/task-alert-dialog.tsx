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
import { InfoIcon } from "lucide-react";
import { useRouter } from "next/navigation";

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

  const handleProceed = () => {
    if (task) {
      updateTaskStatus(task.id, "in-progress");
      window.open(`https://${task.website}`, "_blank");
      onOpenChange(false);
    }
  };

  const handleViewRecording = () => {
    if (task) {
      updateTaskStatus(task.id, "completed");
      onOpenChange(false);

      setTimeout(() => {
        router.push(`/recordings?taskId=${task.id}`);
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
          <AlertDialogCancel>Cancel</AlertDialogCancel>

          {completionStatus ? (
            <AlertDialogAction onClick={handleViewRecording}>
              View Recording
            </AlertDialogAction>
          ) : (
            <AlertDialogAction onClick={handleProceed}>
              Proceed to Website
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
