"use client";

import { useState, useEffect, useCallback } from "react";

type Permission = "default" | "granted" | "denied" | "unsupported";

/**
 * Detect notification support + current permission. Safe to call during SSR
 * (returns "default" since `window` is undefined).
 */
function detectPermission(): Permission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission as Permission;
}

/**
 * Hook for managing browser notification permissions and sending
 * local notifications (no push server needed). Falls back gracefully
 * on unsupported browsers.
 */
export function useNotifications() {
  // Lazy initializer reads the current permission on first client render.
  // (Returns "default" during SSR — fine for client components.)
  const [permission, setPermission] = useState<Permission>(() => detectPermission());

  const requestPermission = useCallback(async (): Promise<Permission> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result as Permission);
      return result as Permission;
    } catch {
      return "denied";
    }
  }, []);

  const notify = useCallback(
    (title: string, options?: NotificationOptions & { body: string }) => {
      if (permission !== "granted") return false;
      try {
        new Notification(title, {
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          ...options,
        });
        return true;
      } catch {
        return false;
      }
    },
    [permission],
  );

  return { permission, requestPermission, notify };
}
