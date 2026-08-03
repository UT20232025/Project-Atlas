"use client";

import { useEffect, useRef, useState } from "react";

export function usePriceFlash(
  value: number
): "up" | "down" | null {
  const previousValueRef = useRef(value);
  const timeoutRef = useRef<number | null>(null);
  const [flash, setFlash] = useState<"up" | "down" | null>(
    null
  );

  useEffect(() => {
    if (value !== previousValueRef.current) {
      setFlash(
        value > previousValueRef.current ? "up" : "down"
      );
      previousValueRef.current = value;

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setFlash(null);
      }, 700);
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return flash;
}
