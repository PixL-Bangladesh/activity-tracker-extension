"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

export default function WelcomePage() {
  const router = useRouter();
  const { setTheme } = useTheme();

  // Set default theme to dark on initial load
  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center mr-4">
            <span className="text-3xl font-bold text-primary-foreground">
              S
            </span>
          </div>
          <h1 className="text-5xl font-bold text-foreground">ScreenTrail</h1>
        </div>
        <p className="text-xl mb-12 text-muted-foreground">
          Track your digital journey across the web
        </p>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => router.push("/dashboard")}
            size="lg"
            className="rounded-full w-16 h-16 p-0 bg-primary hover:bg-primary/90"
          >
            <motion.span
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 2,
                ease: "easeInOut",
              }}
              className="text-primary-foreground"
            >
              Start
            </motion.span>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
