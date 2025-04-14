"use client";

import { createClient } from "@/utils/supabase/client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

export type TaskStatus = "not-started" | "in-progress" | "completed";
const supabase = createClient();

interface TaskStatusContextType {
  taskStatuses: Record<string, TaskStatus>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  resetAllStatuses: () => Promise<void>;
  isLoading: boolean;
}

const TaskStatusContext = createContext<TaskStatusContextType | undefined>(
  undefined
);

export function TaskStatusProvider({ children }: { children: ReactNode }) {
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);

  // Fetch task statuses when the component mounts
  useEffect(() => {
    async function fetchTaskStatuses() {
      try {
        setIsLoading(true);

        // Get the current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsLoading(false);
          return;
        }

        // Fetch the user's profile
        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("task_statuses")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "no rows returned" error
          console.error("Error fetching task statuses:", error);
          toast.error("Error loading task data");
          setIsLoading(false);
          return;
        }

        // If the profile exists and has task_statuses, set them
        if (profile?.task_statuses) {
          setTaskStatuses(profile.task_statuses);
        }
      } catch (error) {
        console.error("Error in fetchTaskStatuses:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTaskStatuses();

    // Set up a subscription to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        fetchTaskStatuses();
      } else if (event === "SIGNED_OUT") {
        setTaskStatuses({});
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (status === "in-progress") {
        localStorage.setItem("inRecordingTaskId", taskId);
      } else {
        localStorage.removeItem("inRecordingTaskId");
      }

      if (!user) {
        toast.error("Please sign in to update task statuses");
        return;
      }

      // Update local state first for immediate UI feedback
      const updatedStatuses = {
        ...taskStatuses,
        [taskId]: status,
      };
      setTaskStatuses(updatedStatuses);

      // Update the user's profile in Supabase
      const { error } = await supabase
        .from("user_profiles")
        .update({
          task_statuses: updatedStatuses,
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating task status:", error);
        toast.error("Failed to save your changes");

        // Revert the local state if the server update failed
        // You might want to fetch the latest state from the server instead
        const { data } = await supabase
          .from("user_profiles")
          .select("task_statuses")
          .eq("id", user.id)
          .single();

        if (data?.task_statuses) {
          setTaskStatuses(data.task_statuses);
        }
      }
    } catch (error) {
      console.error("Error in updateTaskStatus:", error);
    }
  };

  const resetAllStatuses = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset all progress? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to reset task statuses");
        return;
      }

      // Clear local state first
      setTaskStatuses({});

      // Update the user's profile in Supabase
      const { error } = await supabase
        .from("user_profiles")
        .update({
          task_statuses: {},
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error resetting task statuses:", error);
        toast.error("Failed to reset your progress");
      } else {
        toast.success("All task progress has been reset");
      }
    } catch (error) {
      console.error("Error in resetAllStatuses:", error);
    }
  };

  return (
    <TaskStatusContext.Provider
      value={{ taskStatuses, updateTaskStatus, resetAllStatuses, isLoading }}
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
