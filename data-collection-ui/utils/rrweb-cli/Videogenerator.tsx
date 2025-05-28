import type { eventWithTime } from "@rrweb/types";
import { EventType } from "@rrweb/types";
// Import Player directly like the CLI does
import Player from "rrweb-player";

// This should match the constant in the CLI's index.ts
const MaxScaleValue = 2.5;

export interface VideoGenerationConfig {
  events: eventWithTime[];
  width?: number;
  height?: number;
  filename?: string;
  resolutionRatio?: number;
  onProgress?: (progress: number) => void;
  onComplete?: (blob: Blob) => void;
  onError?: (error: Error) => void;
  rrwebPlayer?: Omit<
    ConstructorParameters<typeof Player>[0]["props"],
    "events"
  >; // Exact type from CLI
}

export class BrowserVideoGenerator {
  private playerContainer: HTMLDivElement | null = null;
  private player: Player | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private replayFinished = false;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
  }

  async generateVideo(options: VideoGenerationConfig): Promise<Blob> {
    // Default config exactly like CLI
    const defaultConfig = {
      resolutionRatio: 0.8,
      rrwebPlayer: {},
    };

    const config = { ...defaultConfig, ...options };

    const {
      events,
      width,
      height,
      filename = "recording.webm",
      resolutionRatio,
      onProgress,
      onComplete,
      onError,
      rrwebPlayer,
    } = config;

    try {
      // Make the browser viewport fit the player size (exactly like CLI)
      const maxViewport = this.getMaxViewport(events);

      // Use the scaling method to improve the video quality (exactly like CLI)
      const scaledViewport = {
        width: Math.round(
          (width || maxViewport.width) * resolutionRatio * MaxScaleValue
        ),
        height: Math.round(
          (height || maxViewport.height) * resolutionRatio * MaxScaleValue
        ),
      };

      // Assign scaledViewport to rrwebPlayer config (exactly like CLI)
      Object.assign(rrwebPlayer, scaledViewport);

      // Set canvas size to match scaled viewport
      this.canvas.width = scaledViewport.width;
      this.canvas.height = scaledViewport.height;

      // Create player container
      await this.createPlayerContainer();

      // Create player directly (like CLI creates browser page)
      await this.createPlayer(events, rrwebPlayer, resolutionRatio);

      // Start recording
      const videoBlob = await this.recordVideo(onProgress);

      onComplete?.(videoBlob);
      return videoBlob;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      throw err;
    } finally {
      this.cleanup();
    }
  }

  // Exact copy of getMaxViewport from CLI's index.ts
  private getMaxViewport(events: eventWithTime[]) {
    let maxWidth = 0;
    let maxHeight = 0;
    // biome-ignore lint/complexity/noForEach: <explanation>
    events.forEach((event) => {
      if (event.type !== EventType.Meta) return;
      if (event.data.width > maxWidth) maxWidth = event.data.width;
      if (event.data.height > maxHeight) maxHeight = event.data.height;
    });
    return {
      width: maxWidth,
      height: maxHeight,
    };
  }

  private async createPlayerContainer(): Promise<void> {
    this.playerContainer = document.createElement("div");
    this.playerContainer.style.position = "fixed";
    this.playerContainer.style.left = "-9999px";
    this.playerContainer.style.top = "0px";
    this.playerContainer.style.width = `${this.canvas.width}px`;
    this.playerContainer.style.height = `${this.canvas.height}px`;
    this.playerContainer.style.background = "#ffffff";
    this.playerContainer.style.overflow = "hidden";

    document.body.appendChild(this.playerContainer);
  }

  private async createPlayer(
    events: eventWithTime[],
    playerConfig: any,
    resolutionRatio: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.playerContainer) {
          reject(new Error("Player container not created"));
          return;
        }

        // Create player exactly like CLI does
        this.player = new Player({
          target: this.playerContainer,
          props: {
            events,
            width: playerConfig.width,
            height: playerConfig.height,
            showController: false,
            autoPlay: false, // We'll control this manually
            ...playerConfig, // Any additional config
          },
        });

        // Set up event listeners exactly like CLI
        this.player.addEventListener("finish", () => {
          console.log("Replay finished");
          this.replayFinished = true;
        });

        this.player.addEventListener("ui-update-progress", (payload) => {
          // Handle progress updates if needed
        });

        // Apply scaling transform exactly like CLI
        this.player.addEventListener("resize", () => {
          const wrapper = this.playerContainer?.querySelector(
            ".replayer-wrapper"
          ) as HTMLElement;
          if (wrapper) {
            wrapper.style.transform = `scale(${
              resolutionRatio * MaxScaleValue
            }) translate(-50%, -50%)`;
            wrapper.style.transformOrigin = "top left";
          }
        });

        // Wait for player to initialize
        setTimeout(() => {
          resolve();
        }, 1000);
      } catch (error) {
        reject(error);
      }
    });
  }

  private async recordVideo(
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // Create stream from canvas
        const stream = this.canvas.captureStream(30);

        this.mediaRecorder = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=vp9",
          videoBitsPerSecond: 2500000,
        });

        this.recordedChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) this.recordedChunks.push(event.data);
        };

        this.mediaRecorder.onstop = () => {
          resolve(new Blob(this.recordedChunks, { type: "video/webm" }));
        };

        this.mediaRecorder.onerror = () => {
          reject(new Error("MediaRecorder error"));
        };

        this.mediaRecorder.start();

        // Start the player (equivalent to CLI's page.setContent)
        if (this.player) {
          this.player.play();
        }

        // Start capturing frames
        this.captureFrames(onProgress).then(() => {
          if (this.mediaRecorder?.state === "recording") {
            this.mediaRecorder.stop();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private async captureFrames(
    onProgress?: (progress: number) => void
  ): Promise<void> {
    // biome-ignore lint/suspicious/noAsyncPromiseExecutor: <explanation>
    return new Promise(async (resolve) => {
      let frameCount = 0;
      const maxFrames = 30 * 60; // 60 seconds max at 30 FPS

      const captureFrame = async () => {
        // Check if replay is finished (equivalent to CLI's promise resolution)
        if (
          this.replayFinished ||
          frameCount >= maxFrames ||
          this.mediaRecorder?.state !== "recording"
        ) {
          console.log("Capture finished:", {
            replayFinished: this.replayFinished,
            frameCount,
            maxFrames,
          });
          resolve();
          return;
        }

        try {
          if (this.playerContainer) {
            // Import html2canvas dynamically
            const { default: html2canvas } = await import("html2canvas");
            const capturedCanvas = await html2canvas(this.playerContainer, {
              width: this.canvas.width,
              height: this.canvas.height,
              scale: 1,
              logging: false,
              useCORS: true,
              allowTaint: true,
              backgroundColor: "#ffffff",
            });

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(capturedCanvas, 0, 0);
          } else {
            // Fallback frame
            this.ctx.fillStyle = "#ffffff";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = "#ff0000";
            this.ctx.fillText("No player container", 50, 50);
          }
        } catch (error) {
          console.error("Capture error:", error);
          // Draw fallback frame on error
          this.ctx.fillStyle = "#ffffff";
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.fillStyle = "#000000";
          this.ctx.fillText(`Frame ${frameCount} - Error: ${error}`, 50, 50);
        }

        frameCount++;
        if (onProgress) {
          const progress = Math.min(frameCount / maxFrames, 1);
          onProgress(progress);
        }

        setTimeout(captureFrame, 1000 / 30); // 30 FPS
      };

      // Start capturing after a delay
      setTimeout(captureFrame, 2000); // Give player more time to start
    });
  }

  private cleanup(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }

    if (this.playerContainer?.parentNode) {
      this.playerContainer.parentNode.removeChild(this.playerContainer);
    }

    this.player = null;
    this.playerContainer = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.replayFinished = false;
  }

  static downloadVideo(blob: Blob, filename = "recording.webm"): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
