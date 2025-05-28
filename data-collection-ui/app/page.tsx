"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Download, ExternalLink } from "lucide-react";

export default function WelcomePage() {
  const router = useRouter();
  const { setTheme } = useTheme();

  // Set default theme to dark on initial load
  useEffect(() => {
    setTheme("system");
  }, [setTheme]);

  const handleDownloadExtension = () => {
    window.open(
      "https://drive.google.com/file/d/1sWt-Q3kFScbWK41uf08ydV2iKU6JimOA/view?usp=drive_link",
      "_blank"
    );
  };

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

        <div className="flex flex-col items-center gap-6">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => router.push("/auth")}
              size="lg"
              className="rounded-full w-24 h-24 p-0 bg-primary hover:bg-primary/90 cursor-pointer"
            >
              <motion.span
                animate={{
                  scale: [1, 1.2, 1],
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

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
              <span>First time? Get the browser extension</span>
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleDownloadExtension}
                variant="outline"
                size="sm"
                className="group border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
              >
                <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                Download Extension
                <ExternalLink className="w-3 h-3 ml-2 opacity-60 group-hover:opacity-100 transition-opacity" />
              </Button>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8 text-xs text-muted-foreground/60"
        >
          Compatible with Chrome & Edge browsers
        </motion.div>
      </motion.div>
    </div>
  );
}
