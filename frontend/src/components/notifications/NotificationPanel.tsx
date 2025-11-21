'use client';

import { useState, useEffect } from 'react';
import { Settings, Check, Trash2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Notification, NotificationType } from '@/types';
import { NotificationItem } from './NotificationItem';

interface NotificationPanelProps {
  onUnreadCountChange?: (count: number) => void;
}

export function NotificationPanel({ onUnreadCountChange }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {
        isRead: activeTab === 'unread' ? false : undefined,
        limit: 50,
      };
      const response = await api.getNotifications(params);
      setNotifications(response.data);

      // Update unread count
      const unreadCount = response.data.filter((n: Notification) => !n.isRead).length;
      onUnreadCountChange?.(unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông báo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId?: string) => {
    try {
      await api.markNotificationsAsRead(notificationId ? [notificationId] : []);
      await fetchNotifications();
      toast({
        title: 'Thành công',
        description: notificationId
          ? 'Đã đánh dấu đã đọc'
          : 'Đã đánh dấu tất cả đã đọc',
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể đánh dấu đã đọc',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRead = async () => {
    try {
      await api.deleteAllReadNotifications();
      await fetchNotifications();
      toast({
        title: 'Thành công',
        description: 'Đã xóa thông báo đã đọc',
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa thông báo',
        variant: 'destructive',
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-col h-[500px]">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">Thông báo</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchNotifications}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Link href="/dashboard/notifications/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'unread')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">
              Tất cả ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Chưa đọc ({unreadCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Actions */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 bg-muted/30 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleMarkAsRead()}
            disabled={unreadCount === 0}
            className="text-xs"
          >
            <Check className="h-3 w-3 mr-1" />
            Đọc tất cả
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteRead}
            disabled={unreadCount === notifications.length}
            className="text-xs text-muted-foreground"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Xóa đã đọc
          </Button>
        </div>
      )}

      {/* Notification List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="rounded-full bg-muted p-4 mb-3">
              <Check className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Không có thông báo</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTab === 'unread'
                ? 'Bạn đã đọc hết thông báo'
                : 'Chưa có thông báo nào'}
            </p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Separator />
          <div className="p-3 text-center">
            <Link href="/dashboard/notifications">
              <Button variant="ghost" size="sm" className="text-xs w-full">
                Xem tất cả thông báo
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
