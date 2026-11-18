"use client";
// One place that knows how this device stores things.
//
// Every slice of the store used to carry its own copy of
// `try { localStorage.setItem(...) } catch {}`, which is why some slices
// quietly never persisted at all — the line was simply missing and nothing
// said so. Going through one hook makes persistence the default rather than
// something each writer has to remember.
// © 2026 RidgeFront. All rights reserved.
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

export function usePersisted<T>(
  key: string,
  initial: T,
  revive?: (raw: unknown) => T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initial);
  // Saving is gated on this so the first commit cannot write the seed value
  // over real saved data before the load effect has read it.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw);
        setValue(revive ? revive(parsed) : (parsed as T));
      }
    } catch {
      // Unreadable data is left alone rather than overwritten.
    }
    setHydrated(true);
    // `revive` is a render-time closure; the key alone identifies the slot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private mode, a full quota, or blocked site data. The app keeps working
      // from memory for this session.
    }
  }, [key, value, hydrated]);

  return [value, setValue];
}
