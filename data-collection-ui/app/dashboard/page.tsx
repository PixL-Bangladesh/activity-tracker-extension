"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { taskCategories } from "@/lib/task-data";
import { useTaskStatus } from "@/contexts/task-status-context";
import { CheckCircle, Clock, ArrowRight, FileWarning } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { taskStatuses, resetAllStatuses } = useTaskStatus();
  const [mounted, setMounted] = useState(false);

  // Ensure we only render after hydration to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate statistics
  const totalTasks = taskCategories.reduce(
    (acc, category) => acc + category.tasks.length,
    0
  );
  const completedTasks = Object.values(taskStatuses).filter(
    (status) => status === "completed"
  ).length;
  const inProgressTasks = Object.values(taskStatuses).filter(
    (status) => status === "in-progress"
  ).length;
  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate category statistics
  const categoryStats = taskCategories.map((category) => {
    const totalCategoryTasks = category.tasks.length;
    const completedCategoryTasks = category.tasks.filter(
      (task) => taskStatuses[task.id] === "completed"
    ).length;
    const inProgressCategoryTasks = category.tasks.filter(
      (task) => taskStatuses[task.id] === "in-progress"
    ).length;
    const completionPercentage =
      totalCategoryTasks > 0
        ? Math.round((completedCategoryTasks / totalCategoryTasks) * 100)
        : 0;

    return {
      id: category.id,
      name: category.name,
      total: totalCategoryTasks,
      completed: completedCategoryTasks,
      inProgress: inProgressCategoryTasks,
      percentage: completionPercentage,
    };
  });

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4 lg:px-8">
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <div className="ml-auto flex items-center gap-4">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={resetAllStatuses}>
                Reset Progress
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Alert className="mb-6">
            <FileWarning className="h-4 w-4" />
            <AlertDescription>
              ⚠️ Do NOT clear your browser cache—your progress is stored
              locally.
            </AlertDescription>
          </Alert>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTasks}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {completedTasks}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">
                  {inProgressTasks}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {completionPercentage}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bento Grid for Category Stats */}
          <h2 className="text-lg font-medium mb-4">Category Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryStats.map((category) => (
              <Card
                key={category.id}
                className={
                  category.percentage === 100
                    ? "border-green-500/30 bg-green-500/5"
                    : ""
                }
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex justify-between">
                    {category.name}
                    <span className="text-sm font-normal text-muted-foreground">
                      {category.completed}/{category.total} tasks
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Completed: {category.completed}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span>In Progress: {category.inProgress}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium">
                        {category.percentage}% complete
                      </div>
                      <Link href="/tasks">
                        <Button variant="ghost" size="sm" className="h-8 gap-1">
                          <span>View Tasks</span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
