"use client";

import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Bell,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Eye,
  Copy,
  Wifi,
  Shield,
  Award,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Notification, NotificationType, NotificationPriority } from "@/types";

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  [NotificationType.EXAM_CREATED]: <BookOpen className="h-4 w-4" />,
  [NotificationType.EXAM_UPDATED]: <BookOpen className="h-4 w-4" />,
  [NotificationType.EXAM_REMINDER]: <Clock className="h-4 w-4" />,
  [NotificationType.EXAM_STARTED]: <CheckCircle2 className="h-4 w-4" />,
  [NotificationType.EXAM_ENDING]: <AlertTriangle className="h-4 w-4" />,
  [NotificationType.EXAM_ENDED]: <XCircle className="h-4 w-4" />,
  [NotificationType.MESSAGE_RECEIVED]: <MessageSquare className="h-4 w-4" />,
  [NotificationType.SUSPICIOUS_ACTIVITY]: <AlertTriangle className="h-4 w-4" />,
  [NotificationType.TAB_SWITCH_WARNING]: <Eye className="h-4 w-4" />,
  [NotificationType.SCREEN_SHARING_DETECTED]: <Eye className="h-4 w-4" />,
  [NotificationType.COPY_PASTE_ATTEMPT]: <Copy className="h-4 w-4" />,
  [NotificationType.IP_VIOLATION]: <Wifi className="h-4 w-4" />,
  [NotificationType.FINGERPRINT_MISMATCH]: <Shield className="h-4 w-4" />,
  [NotificationType.SYSTEM]: <Bell className="h-4 w-4" />,
  [NotificationType.GRADE_PUBLISHED]: <Award className="h-4 w-4" />,
  [NotificationType.ATTEMPT_SUBMITTED]: <CheckCircle2 className="h-4 w-4" />,
};

const priorityColors: Record<NotificationPriority, string> = {
  [NotificationPriority.LOW]: "text-gray-500",
  [NotificationPriority.MEDIUM]: "text-blue-500",
  [NotificationPriority.HIGH]: "text-orange-500",
  [NotificationPriority.URGENT]: "text-red-500",
};

export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const icon = notificationIcons[notification.type];
  const iconColor = priorityColors[notification.priority];

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-4 text-left transition-colors",
        "hover:bg-accent/50",
        "border-b border-border last:border-0",
        "overflow-hidden",
        !notification.isRead && "bg-accent/20"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 mt-0.5 p-2 rounded-lg",
          notification.isRead ? "bg-muted" : "bg-primary/10",
          iconColor
        )}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              "text-sm line-clamp-1 break-words overflow-hidden overflow-wrap-anywhere",
              notification.isRead ? "font-medium" : "font-semibold"
            )}
          >
            {notification.title}
          </h4>
          {!notification.isRead && (
            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
          )}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 break-words overflow-hidden overflow-wrap-anywhere">
          {notification.message}
        </p>

        {notification.exam && (
          <p className="text-xs text-muted-foreground truncate overflow-hidden">
            📚{" "}
            <span className="break-all">
              {notification.exam.subject} - {notification.exam.title}
            </span>
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: vi,
          })}
        </p>
      </div>
    </button>
  );
}
