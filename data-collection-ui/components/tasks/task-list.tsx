"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Dispatch, SetStateAction } from "react";
import { cn } from "@/lib/utils";

// Task interface
export interface Task {
  id: string;
  label: string;
}

interface TaskListProps {
  category: string;
  tasks: Task[];
  completedCount: number;
  totalTasks: number;
  completedTasks: Record<string, boolean>;
  setCompletedTasks: Dispatch<SetStateAction<Record<string, boolean>>>;
  variant?: "not-started" | "in-progress" | "completed";
}

export function TaskList({
  category,
  tasks,
  completedCount,
  totalTasks,
  completedTasks,
  setCompletedTasks,
  variant = "not-started",
}: TaskListProps) {
  // Handle checkbox change
  const handleTaskChange = (taskId: string, checked: boolean) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: checked,
    }));
  };

  // Get status badge variant
  const getStatusBadge = () => {
    if (completedCount === 0)
      return (
        <Badge variant="outline" className="bg-card text-muted-foreground">
          Not Started
        </Badge>
      );
    if (completedCount === totalTasks)
      return <Badge className="bg-green-600">Completed</Badge>;

    const percentage = (completedCount / totalTasks) * 100;
    if (percentage < 50) return <Badge className="bg-amber-600">Low</Badge>;
    return <Badge className="bg-amber-500">Mid</Badge>;
  };

  return (
    <Card
      className={cn(
        "border shadow-sm hover:shadow-md transition-shadow duration-200",
        variant === "completed" && "border-green-900/20 bg-green-900/5",
        variant === "in-progress" && "border-amber-900/20 bg-amber-900/5"
      )}
    >
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-medium">{category}</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {completedCount}/{totalTasks}
          </span>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start space-x-3">
              <Checkbox
                id={task.id}
                checked={!!completedTasks[task.id]}
                onCheckedChange={(checked) =>
                  handleTaskChange(task.id, checked === true)
                }
                className="mt-0.5"
              />
              <label
                htmlFor={task.id}
                className={`text-sm ${
                  completedTasks[task.id]
                    ? "line-through text-muted-foreground"
                    : ""
                }`}
              >
                {task.label}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
