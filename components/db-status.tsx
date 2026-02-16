"use client";

import { useEffect, useState } from "react";

type Status = "checking" | "connected" | "error";

export function DbStatus() {
  const [status, setStatus] = useState<Status>("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/db-check")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.connected) {
          setStatus("connected");
          setErrorMessage(null);
        } else {
          setStatus("error");
          setErrorMessage(data.error ?? "Connection failed");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage("Request failed");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") {
    return <span className="text-muted">DB: checking…</span>;
  }
  if (status === "connected") {
    return (
      <span className="text-emerald-500/90" title="Supabase connected">
        DB: Connected
      </span>
    );
  }
  return (
    <span
      className="text-red-400/90"
      title={errorMessage ?? "Supabase connection failed"}
    >
      DB: Error
    </span>
  );
}
