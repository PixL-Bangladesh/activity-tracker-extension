"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";

export type TaskStatus = "not-started" | "in-progress" | "completed";

interface TaskStatusContextType {
  taskStatuses: Record<string, TaskStatus>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  resetAllStatuses: () => void;
}

const TaskStatusContext = createContext<TaskStatusContextType | undefined>(
  undefined
);

export function TaskStatusProvider({ children }: { children: ReactNode }) {
  const [taskStatuses, setTaskStatuses] = useLocalStorageState<
    Record<string, TaskStatus>
  >("task-statuses", {});

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTaskStatuses((prev) => ({
      ...prev,
      [taskId]: status,
    }));
  };

  const resetAllStatuses = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all progress? This cannot be undone."
      )
    ) {
      setTaskStatuses({});
    }
  };

  return (
    <TaskStatusContext.Provider
      value={{ taskStatuses, updateTaskStatus, resetAllStatuses }}
    >
      {children}
    </TaskStatusContext.Provider>
  );
}

export function useTaskStatus() {
  const context = useContext(TaskStatusContext);
  if (context === undefined) {
    throw new Error("useTaskStatus must be used within a TaskStatusProvider");
  }
  return context;
}
