"use client";

import { Button } from "@/components/ui/button";
import { HomeIcon, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="flex flex-1 flex-col items-center justify-center min-h-screen p-6 text-center">
          <div className="max-w-md space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">
              Oops! A Critical Error Occurred
            </h1>

            <p className="text-muted-foreground">
              {error?.message ||
                "Something went wrong with the application. Please try again."}
            </p>

            {process.env.NODE_ENV !== "production" && (
              <div className="p-4 bg-muted rounded-md text-left text-sm">
                <p className="font-medium">Error details (development only):</p>
                <pre className="mt-2 overflow-auto">{error?.stack}</pre>
                {error?.digest && (
                  <p className="mt-2">Digest: {error?.digest}</p>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => reset()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
              <Link href="/">
                <Button variant="outline" className="flex items-center gap-2">
                  <HomeIcon className="h-4 w-4" />
                  Back to home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
