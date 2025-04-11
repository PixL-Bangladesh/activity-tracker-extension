"use client";

import { useState, useEffect, type Dispatch, type SetStateAction } from "react";

// Custom hook to sync state with localStorage
export function useLocalStorageState<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  // Initialize state with function to avoid unnecessary localStorage access on every render
  const [state, setState] = useState<T>(() => {
    // Only run in the browser
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error("Error writing to localStorage:", error);
      }
    }
  }, [key, state]);

  return [state, setState];
}
