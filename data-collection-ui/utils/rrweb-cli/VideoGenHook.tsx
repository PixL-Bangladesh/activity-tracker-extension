// filepath: hooks/useVideoGenerator.ts
import { useState } from "react";
import {
  BrowserVideoGenerator,
  type VideoGenerationConfig,
} from "@/utils/rrweb-cli/Videogenerator";
import { toast } from "sonner";

export function useVideoGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateVideo = async (
    config: Omit<VideoGenerationConfig, "onProgress" | "onComplete" | "onError">
  ) => {
    if (isGenerating) return;

    setIsGenerating(true);
    setProgress(0);

    const generator = new BrowserVideoGenerator();

    try {
      toast.info("Starting video generation...");

      const videoBlob = await generator.generateVideo({
        ...config,
        onProgress: (progress) => {
          setProgress(progress);
        },
        onComplete: (blob) => {
          toast.success("Video generated successfully!");
          BrowserVideoGenerator.downloadVideo(
            blob,
            config.filename || "recording.webm"
          );
        },
        onError: (error) => {
          toast.error("Failed to generate video", {
            description: error.message,
          });
        },
      });

      return videoBlob;
    } catch (error) {
      console.error("Video generation failed:", error);
      throw error;
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return {
    generateVideo,
    isGenerating,
    progress,
  };
}
