"use client";

import dynamic from "next/dynamic";

// Dynamically import NotificationListener with no SSR
const NotificationListener = dynamic(
  () =>
    import("@/components/notifications/NotificationListener").then((mod) => ({
      default: mod.NotificationListener,
    })),
  { ssr: false }
);

export function ClientNotificationListener() {
  return <NotificationListener />;
}
