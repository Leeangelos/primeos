"use client";

import { useEffect } from "react";

export function AppRefreshHandler() {
  useEffect(() => {
    let lastHidden = 0;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        lastHidden = Date.now();
      } else {
        const awayTime = Date.now() - lastHidden;
        if (lastHidden > 0 && awayTime > 5 * 60 * 1000) {
          window.location.reload();
          return;
        }
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.ready.then((reg) => reg.update());
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    let controllerChangeHandler: () => void = () => {};
    if ("serviceWorker" in navigator) {
      controllerChangeHandler = () => window.location.reload();
      navigator.serviceWorker.addEventListener("controllerchange", controllerChangeHandler);
      navigator.serviceWorker.ready.then((reg) => reg.update());
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("controllerchange", controllerChangeHandler);
      }
    };
  }, []);

  return null;
}
