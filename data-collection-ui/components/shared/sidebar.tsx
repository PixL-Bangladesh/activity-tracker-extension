"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CheckSquare, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { logout } from "@/actions/auth";
import { toast } from "sonner";
import { useErrorHandler } from "@/lib/handle-error";

const sidebarItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Tasks",
    icon: CheckSquare,
    href: "/dashboard/tasks",
  },
  // {
  //   title: "Recordings",
  //   icon: Camera,
  //   href: "/dashboard/recordings",
  // },
  // {
  //   title: "Analytics",
  //   icon: ChartNoAxesCombined,
  //   href: "/dashboard/analytics",
  // },
];

export function Sidebar() {
  const pathname = usePathname();
  const { handleError } = useErrorHandler();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      handleError(error as Error, "Logout failed");
    }
  };

  return (
    <div className="hidden md:flex h-screen w-64 flex-col border-r bg-card/60">
      <div className="flex h-14 items-center border-b px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <span className="font-bold text-primary-foreground">S</span>
          </div>
          <span className="font-semibold text-lg">ScreenTrail</span>
        </div>
      </div>

      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto py-2">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
              Menu
            </h2>
            <div className="space-y-1">
              {sidebarItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-primary text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Logout button at bottom */}
        <div className="border-t p-3 mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
