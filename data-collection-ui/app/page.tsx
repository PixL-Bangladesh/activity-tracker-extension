"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Download, ExternalLink } from "lucide-react";
import { FaChrome as Chrome, FaFirefox as Firefox } from "react-icons/fa";

export default function WelcomePage() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Set default theme to dark on initial load
  useEffect(() => {
    setTheme("system");
  }, [setTheme]);

  const downloadLinks = {
    chrome: {
      crx: "https://drive.google.com/file/d/1F-NRlVNXqi2KpX3ZC9ofzP48l0ZamKox/view?usp=sharing",
      zip: "https://drive.google.com/file/d/18YE2t-o9Zdjxd2ZLg62pTojSEFQ7Xf-6/view?usp=sharing",
    },
    firefox: {
      crx: "https://drive.google.com/file/d/11waEZnw6jJlv_qwMgiexuCwFwz2UY8l_/view?usp=sharing",
      zip: "https://drive.google.com/file/d/1RMdeJHhGhzJITNFpUNMf05UB2KtoZyld/view?usp=sharing",
    },
  };

  const handleDownload = (
    browser: "chrome" | "firefox",
    format: "crx" | "zip"
  ) => {
    window.open(downloadLinks[browser][format], "_blank");
    setDialogOpen(false);
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
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="group border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
                  >
                    <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                    Download Extension
                    <ExternalLink className="w-3 h-3 ml-2 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Download Browser Extension</DialogTitle>
                    <DialogDescription>
                      Choose your browser and preferred format. CRX files work
                      on Windows/Linux, ZIP files work on all platforms
                      including Mac.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 gap-4 py-4">
                    {/* Chrome Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Chrome className="w-4 h-4 text-blue-500" />
                        Chrome
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => handleDownload("chrome", "crx")}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          CRX
                        </Button>
                        <Button
                          onClick={() => handleDownload("chrome", "zip")}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          ZIP
                        </Button>
                      </div>
                    </div>

                    {/* Firefox Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Firefox className="w-4 h-4 text-orange-500" />
                        Firefox
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => handleDownload("firefox", "crx")}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          CRX
                        </Button>
                        <Button
                          onClick={() => handleDownload("firefox", "zip")}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          ZIP
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p className="mb-1">
                      • CRX: Direct installation (Windows/Linux)
                    </p>
                    <p>
                      • ZIP: Manual installation (All platforms, including Mac)
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8 text-xs text-muted-foreground/60"
        >
          Compatible with Chrome & Firefox browsers
        </motion.div>
      </motion.div>
    </div>
  );
}
