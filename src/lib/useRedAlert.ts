"use client";

import { useEffect, useRef } from "react";
import { vibrateOnRed } from "./haptics";

/**
 * Triggers a single vibration when any value in the grades array is "red".
 * Only vibrates once per render cycle (not continuously).
 */
export function useRedAlert(grades: string[]) {
  const hasVibrated = useRef(false);

  useEffect(() => {
    const hasRed = grades.some((g) => g === "red");
    if (hasRed && !hasVibrated.current) {
      vibrateOnRed();
      hasVibrated.current = true;
    }
    if (!hasRed) {
      hasVibrated.current = false;
    }
  }, [grades]);
}
