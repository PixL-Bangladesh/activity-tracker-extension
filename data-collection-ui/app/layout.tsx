import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TaskStatusProvider } from "@/contexts/task-status-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ScreenTrail - Task Dashboard",
  description: "Track your digital journey with ScreenTrail",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
        >
          <TaskStatusProvider>
            <div className="flex h-screen">{children}</div>
          </TaskStatusProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
