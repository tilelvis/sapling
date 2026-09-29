"use client";

import { useState } from "react";
import { Bell, BellRing, BellOff, CheckCircle2, X, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNotifications } from "./use-notifications";
import { toast } from "sonner";

const DISMISS_KEY = "forestry-planner-notification-dismissed";

/**
 * Inline opt-in card for browser notifications. Shows only when:
 *  - Notifications are supported
 *  - Permission is "default" (not granted, not denied)
 *  - User hasn't dismissed it before
 */
export function NotificationOptIn() {
  const { permission, requestPermission } = useNotifications();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(DISMISS_KEY) === "1";
  });

  // Don't render if unsupported, already granted/denied, or dismissed
  if (permission === "unsupported" || permission !== "default" || dismissed) {
    return null;
  }

  const handleEnable = async () => {
    const result = await requestPermission();
    if (result === "granted") {
      toast.success("Notifications enabled — you'll get reminders for fees");
      try {
        new Notification("Forestry Tuition Planner", {
          body: "You'll be reminded about upcoming fees and your monthly saving.",
          icon: "/icons/icon-192.png",
        });
      } catch {}
      setDismissed(true);
      localStorage.setItem(DISMISS_KEY, "1");
    } else if (result === "denied") {
      toast.info("Notifications blocked — you can enable them later in browser settings");
      setDismissed(true);
      localStorage.setItem(DISMISS_KEY, "1");
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  return (
    <Card className="p-3 card-shadow border-accent/40 bg-accent/5">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <BellRing className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold">Get fee reminders</p>
          <p className="text-[10px] text-muted-foreground">
            Enable browser notifications so you never miss a tuition deadline.
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" variant="secondary" className="h-7 text-[11px] bg-primary text-primary-foreground" onClick={handleEnable}>
            Enable
          </Button>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground p-1"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}

/**
 * Small status indicator for the header — shows a bell icon with state.
 */
export function NotificationStatusBell() {
  const { permission } = useNotifications();
  if (permission === "unsupported") return null;

  const icon = permission === "granted" ? BellRing : permission === "denied" ? BellOff : Bell;
  const Icon = icon;
  const colorCls = permission === "granted"
    ? "text-primary"
    : permission === "denied"
      ? "text-muted-foreground/50"
      : "text-muted-foreground";

  const titleText = `Notifications: ${permission}`;

  return (
    <span className={cn("inline-flex items-center", colorCls)} title={titleText}>
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}
