"use client";
import { useState, useEffect } from "react";

const DeviceDetector = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const [device, setDevice] = useState("");

  useEffect(() => {
    const handleDeviceDetection = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile =
        /iphone|ipad|ipod|android|blackberry|windows phone/g.test(userAgent);
      const isTablet =
        /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/g.test(userAgent);

      if (isMobile) {
        setDevice("Mobile");
      } else if (isTablet) {
        setDevice("Tablet");
      } else {
        setDevice("Desktop");
      }
    };

    handleDeviceDetection();
    window.addEventListener("resize", handleDeviceDetection);

    return () => {
      window.removeEventListener("resize", handleDeviceDetection);
    };
  }, []);

  return (
    <>
      {device === "Mobile" ? (
        <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Desktop Only Application</h1>
          <p className="mb-4">
            ScreenTrail requires our browser extension and is designed for
            desktop use only.
          </p>
          <p className="text-sm text-muted-foreground">
            Please visit this site from a desktop computer or laptop.
          </p>
        </div>
      ) : (
        <>{children}</>
      )}
    </>
  );
};

export default DeviceDetector;
