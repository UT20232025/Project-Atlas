"use client";

import { useEffect, useRef, useState } from "react";

export function useSignalPulse(
  signal: string | undefined
): boolean {
  const previousSignalRef = useRef(signal);
  const timeoutRef = useRef<number | null>(null);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    const previous = previousSignalRef.current;
    previousSignalRef.current = signal;

    if (
      signal !== undefined &&
      previous !== undefined &&
      signal !== previous
    ) {
      setPulsing(true);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setPulsing(false);
      }, 700);
    }
  }, [signal]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return pulsing;
}
