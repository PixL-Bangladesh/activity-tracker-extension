export function isFirefox(): boolean {
  return (
    (typeof window !== "undefined" &&
      window.navigator?.userAgent.toLowerCase().includes("firefox")) ||
    false
  );
}

export function isInCrossOriginIFrame(): boolean {
  if (window.parent !== window) {
    try {
      void window.parent.location.origin;
    } catch (error) {
      return true;
    }
  }
  return false;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

export function formatTime(ms: number): string {
  if (ms <= 0) {
    return "00:00";
  }
  let remainingMs = ms;
  const hour = Math.floor(remainingMs / HOUR);
  remainingMs = remainingMs % HOUR;
  const minute = Math.floor(remainingMs / MINUTE);
  remainingMs = remainingMs % MINUTE;
  const second = Math.floor(remainingMs / SECOND);
  if (hour) {
    return `${padZero(hour)}:${padZero(minute)}:${padZero(second)}`;
  }
  return `${padZero(minute)}:${padZero(second)}`;
}

function padZero(num: number, len = 2): string {
  let str = String(num);
  const threshold = 10 ** (len - 1);
  if (num < threshold) {
    while (String(threshold).length > str.length) {
      str = `0${num}`;
    }
  }
  return str;
}
