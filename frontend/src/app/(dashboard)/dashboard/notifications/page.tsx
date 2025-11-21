'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Filter, Trash2, Check, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Notification } from '@/types';
import { NotificationItem } from '@/components/notifications/NotificationItem';

export default function NotificationsPage() {
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
        limit: 100,
      };
      const response = await api.getNotifications(params);
      setNotifications(response.data);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông báo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markNotificationsAsRead([]);
      await fetchNotifications();
      toast({
        title: 'Thành công',
        description: 'Đã đánh dấu tất cả đã đọc',
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

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await api.markNotificationsAsRead([notification.id]);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        );
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Thông báo</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý tất cả thông báo của bạn
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchNotifications}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Link href="/dashboard/notifications/settings">
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs and Actions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'unread')}>
            <TabsList>
              <TabsTrigger value="all">
                Tất cả ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                Chưa đọc ({unreadCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              <Check className="h-4 w-4 mr-2" />
              Đọc tất cả
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteRead}
              disabled={unreadCount === notifications.length}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa đã đọc
            </Button>
          </div>
        </div>

        {/* Notification List */}
        <div className="border rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Check className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Không có thông báo</h3>
              <p className="text-sm text-muted-foreground">
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
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
