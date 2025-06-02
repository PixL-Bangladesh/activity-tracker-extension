import { CheckIcon } from "lucide-react";
import Image from "next/image";
import React from "react";

const LeftSideLogin = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-sidebar items-center justify-center p-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background to-background/5" />
      <div className="relative z-10 max-w-md">
        <h1 className="text-4xl font-bold mb-6 text-foreground">ScreenTrail</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Track your digital journey with our comprehensive task management
          system.
        </p>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckIcon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm">Task Recording</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckIcon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm">Progress Tracking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckIcon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm">Session Playback</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckIcon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm">Detailed Analytics</span>
          </div>
        </div>
        <div className="h-64 w-64 mx-auto relative">
          <Image
            src="/login-bg.svg"
            alt="Illustration"
            className="object-cover"
            width={256}
            height={256}
          />
        </div>
      </div>
    </div>
  );
};

export default LeftSideLogin;
