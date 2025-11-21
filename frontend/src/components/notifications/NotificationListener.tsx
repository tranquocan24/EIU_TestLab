'use client';

import { useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import socket from '@/lib/socket';
import { Notification, NotificationType } from '@/types';
import {
  Bell,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Award,
} from 'lucide-react';

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  [NotificationType.EXAM_CREATED]: <BookOpen className="h-5 w-5" />,
  [NotificationType.EXAM_UPDATED]: <BookOpen className="h-5 w-5" />,
  [NotificationType.EXAM_REMINDER]: <Clock className="h-5 w-5" />,
  [NotificationType.EXAM_STARTED]: <CheckCircle2 className="h-5 w-5" />,
  [NotificationType.EXAM_ENDING]: <AlertTriangle className="h-5 w-5" />,
  [NotificationType.EXAM_ENDED]: <CheckCircle2 className="h-5 w-5" />,
  [NotificationType.MESSAGE_RECEIVED]: <MessageSquare className="h-5 w-5" />,
  [NotificationType.SUSPICIOUS_ACTIVITY]: <AlertTriangle className="h-5 w-5" />,
  [NotificationType.TAB_SWITCH_WARNING]: <AlertTriangle className="h-5 w-5" />,
  [NotificationType.SCREEN_SHARING_DETECTED]: <AlertTriangle className="h-5 w-5" />,
  [NotificationType.COPY_PASTE_ATTEMPT]: <AlertTriangle className="h-5 w-5" />,
  [NotificationType.IP_VIOLATION]: <AlertTriangle className="h-5 w-5" />,
  [NotificationType.FINGERPRINT_MISMATCH]: <AlertTriangle className="h-5 w-5" />,
  [NotificationType.SYSTEM]: <Bell className="h-5 w-5" />,
  [NotificationType.GRADE_PUBLISHED]: <Award className="h-5 w-5" />,
  [NotificationType.ATTEMPT_SUBMITTED]: <CheckCircle2 className="h-5 w-5" />,
};

interface NotificationListenerProps {
  onNewNotification?: (notification: Notification) => void;
}

export function NotificationListener({ onNewNotification }: NotificationListenerProps) {
  const { toast } = useToast();

  const handleNewNotification = useCallback(
    (notification: Notification) => {
      // Show toast notification
      const icon = notificationIcons[notification.type];
      const isUrgent = notification.priority === 'URGENT' || notification.priority === 'HIGH';

      toast({
        title: (
          <div className="flex items-center gap-2">
            {icon}
            <span>{notification.title}</span>
          </div>
        ) as unknown as string,
        description: notification.message,
        variant: isUrgent ? 'destructive' : 'default',
        duration: isUrgent ? 10000 : 5000,
      });

      // Play notification sound for urgent notifications
      if (isUrgent && typeof window !== 'undefined') {
        try {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {
            // Ignore autoplay errors
          });
        } catch (error) {
          console.error('Failed to play notification sound:', error);
        }
      }

      // Callback to parent component
      onNewNotification?.(notification);
    },
    [toast, onNewNotification]
  );

  useEffect(() => {
    // Connect socket when component mounts
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && !socket.connected) {
        socket.auth = { token };
        socket.connect();
      }
    }

    // Listen for new notifications
    socket.on('notification:new', handleNewNotification);

    // Cleanup on unmount
    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [handleNewNotification]);

  return null; // This is a listener component, no UI
}
