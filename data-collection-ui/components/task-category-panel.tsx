"use client";

import type React from "react";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, ExternalLink } from "lucide-react";
import type { TaskCategory, Task } from "@/lib/task-data";
import { type TaskStatus, useTaskStatus } from "@/contexts/task-status-context";
import { TaskAlertDialog } from "@/components/task-alert-dialog";
import { cn } from "@/lib/utils";

interface TaskCategoryPanelProps {
  category: TaskCategory;
  defaultOpen?: boolean;
}

export function TaskCategoryPanel({
  category,
  defaultOpen,
}: TaskCategoryPanelProps) {
  const { taskStatuses, updateTaskStatus } = useTaskStatus();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);

  const getStatusBadge = (status: TaskStatus | undefined) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600">Completed</Badge>;
      case "in-progress":
        return <Badge className="bg-amber-500">In Progress</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const handleRowClick = (task: Task) => {
    setSelectedTask(task);
    setAlertOpen(true);
  };

  const handleMarkCompleted = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    updateTaskStatus(taskId, "completed");
  };

  // Count completed tasks
  const completedCount = category.tasks.filter(
    (task) => taskStatuses[task.id] === "completed"
  ).length;

  const inProgressCount = category.tasks.filter(
    (task) => taskStatuses[task.id] === "in-progress"
  ).length;

  return (
    <>
      <Accordion
        type="single"
        collapsible
        className={`w-full ${defaultOpen ? "border-b" : "border-b-0"}`}
        defaultValue={defaultOpen ? category.id : undefined}
      >
        <AccordionItem
          value={category.id}
          className="border rounded-lg overflow-hidden"
        >
          <AccordionTrigger
            className={cn(
              "px-4 py-3 hover:no-underline hover:bg-accent/50",
              completedCount === category.tasks.length ? "bg-green-500/10" : ""
            )}
          >
            <div className="flex justify-between items-center w-full">
              <span className="text-lg font-medium">{category.name}</span>
              <div className="flex items-center gap-2">
                {inProgressCount > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-amber-500/10 text-amber-500 border-amber-500/20"
                  >
                    {inProgressCount} In Progress
                  </Badge>
                )}
                {completedCount > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-500 border-green-500/20"
                  >
                    {completedCount} / {category.tasks.length} Completed
                  </Badge>
                )}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4">
              <Table className="md:table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Task Name</TableHead>
                    <TableHead className="w-[15%]">Status</TableHead>
                    <TableHead className="w-[20%]">Average Duration</TableHead>
                    <TableHead className="w-[20%]">Website</TableHead>
                    <TableHead className="w-[15%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {category.tasks.map((task) => (
                    <TableRow
                      key={task.id}
                      className={`cursor-pointer ${
                        taskStatuses[task.id] === "completed"
                          ? "bg-green-500/5"
                          : ""
                      }`}
                      onClick={() => handleRowClick(task)}
                    >
                      <TableCell className="whitespace-normal break-words line-clamp-2">
                        {task.label}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(taskStatuses[task.id])}
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {task.averageDuration}
                      </TableCell>
                      <TableCell>{task.website}</TableCell>
                      <TableCell>
                        {taskStatuses[task.id] === "in-progress" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1"
                            onClick={(e) => handleMarkCompleted(e, task.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Complete</span>
                          </Button>
                        )}
                        {taskStatuses[task.id] !== "in-progress" &&
                          taskStatuses[task.id] !== "completed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span>Start</span>
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <TaskAlertDialog
        task={selectedTask}
        open={alertOpen}
        onOpenChange={setAlertOpen}
        completionStatus={
          selectedTask?.id
            ? taskStatuses[selectedTask.id] === "completed"
            : false
        }
      />
    </>
  );
}
