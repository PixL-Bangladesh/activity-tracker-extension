"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { TaskCategoryPanel } from "@/components/task-category-panel";
import { taskCategories } from "@/lib/task-data";
import { useTaskStatus } from "@/contexts/task-status-context";

export default function TasksPage() {
  const { resetAllStatuses } = useTaskStatus();
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

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

  return (
    <>
      <Sidebar />
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
          <div className="space-y-4">
            {filteredCategories.map((category) => (
              <TaskCategoryPanel key={category.id} category={category} />
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
