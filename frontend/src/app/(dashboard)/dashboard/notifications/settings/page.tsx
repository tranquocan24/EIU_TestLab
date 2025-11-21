'use client';

import { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Save, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { NotificationPreference } from '@/types';

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const data = await api.getNotificationPreferences();
      setPreferences(data);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải cài đặt thông báo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      await api.updateNotificationPreferences(preferences);
      toast({
        title: 'Thành công',
        description: 'Đã lưu cài đặt thông báo',
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu cài đặt',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreference, value: any) => {
    if (preferences) {
      setPreferences({ ...preferences, [key]: value });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!preferences) return null;

  const notificationTypes = [
    { key: 'examCreated', label: 'Bài thi mới', description: 'Thông báo khi có bài thi mới' },
    { key: 'examUpdated', label: 'Cập nhật bài thi', description: 'Thông báo khi bài thi được cập nhật' },
    { key: 'examReminder', label: 'Nhắc nhở bài thi', description: 'Nhắc nhở trước khi bài thi bắt đầu' },
    { key: 'examStarted', label: 'Bài thi bắt đầu', description: 'Thông báo khi bài thi bắt đầu' },
    { key: 'examEnding', label: 'Bài thi sắp kết thúc', description: 'Cảnh báo khi còn ít thời gian' },
    { key: 'examEnded', label: 'Bài thi kết thúc', description: 'Thông báo khi bài thi kết thúc' },
    { key: 'gradePublished', label: 'Điểm đã công bố', description: 'Thông báo khi có điểm mới' },
    { key: 'attemptSubmitted', label: 'Nộp bài thành công', description: 'Xác nhận đã nộp bài' },
    { key: 'messageReceived', label: 'Tin nhắn mới', description: 'Thông báo tin nhắn từ giáo viên' },
    { key: 'system', label: 'Hệ thống', description: 'Thông báo từ hệ thống' },
  ];

  const securityTypes = [
    { key: 'suspiciousActivity', label: 'Hoạt động đáng ngờ', description: 'Cảnh báo hành vi bất thường' },
    { key: 'tabSwitchWarning', label: 'Chuyển tab', description: 'Cảnh báo khi chuyển tab trong thi' },
    { key: 'screenSharingDetected', label: 'Chia sẻ màn hình', description: 'Phát hiện chia sẻ màn hình' },
    { key: 'copyPasteAttempt', label: 'Sao chép/Dán', description: 'Phát hiện thao tác sao chép' },
    { key: 'ipViolation', label: 'Vi phạm IP', description: 'Thay đổi địa chỉ IP trong thi' },
    { key: 'fingerprintMismatch', label: 'Lỗi định danh', description: 'Không khớp dấu hiệu trình duyệt' },
  ];

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Cài đặt thông báo</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý cách bạn nhận thông báo từ hệ thống
        </p>
      </div>

      {/* Delivery Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Kênh nhận thông báo</CardTitle>
          <CardDescription>
            Chọn cách bạn muốn nhận thông báo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="in-app" className="font-medium">Trong ứng dụng</Label>
                <p className="text-sm text-muted-foreground">
                  Hiển thị thông báo trên giao diện
                </p>
              </div>
            </div>
            <Switch
              id="in-app"
              checked={preferences.enableInApp}
              onCheckedChange={(checked) => updatePreference('enableInApp', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="email" className="font-medium">Email</Label>
                <p className="text-sm text-muted-foreground">
                  Gửi thông báo qua email
                </p>
              </div>
            </div>
            <Switch
              id="email"
              checked={preferences.enableEmail}
              onCheckedChange={(checked) => updatePreference('enableEmail', checked)}
            />
          </div>

          {preferences.enableEmail && (
            <div className="ml-8 p-4 bg-muted/30 rounded-lg space-y-3">
              <Label className="text-sm font-medium">Tần suất gửi email</Label>
              <RadioGroup
                value={preferences.emailDigestFrequency}
                onValueChange={(value) => updatePreference('emailDigestFrequency', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="REALTIME" id="realtime" />
                  <Label htmlFor="realtime" className="font-normal cursor-pointer">
                    Ngay lập tức
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="DAILY" id="daily" />
                  <Label htmlFor="daily" className="font-normal cursor-pointer">
                    Tổng hợp hàng ngày
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="WEEKLY" id="weekly" />
                  <Label htmlFor="weekly" className="font-normal cursor-pointer">
                    Tổng hợp hàng tuần
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between opacity-50">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="push" className="font-medium">Push (Sắp có)</Label>
                <p className="text-sm text-muted-foreground">
                  Thông báo đẩy trên thiết bị
                </p>
              </div>
            </div>
            <Switch id="push" disabled />
          </div>
        </CardContent>
      </Card>

      {/* Exam Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Thông báo về bài thi</CardTitle>
          <CardDescription>
            Quản lý thông báo liên quan đến bài thi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {notificationTypes.map((type) => (
            <div key={type.key} className="flex items-center justify-between py-2">
              <div>
                <Label htmlFor={type.key} className="font-medium cursor-pointer">
                  {type.label}
                </Label>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
              <Switch
                id={type.key}
                checked={preferences[type.key as keyof NotificationPreference] as boolean}
                onCheckedChange={(checked) =>
                  updatePreference(type.key as keyof NotificationPreference, checked)
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Cảnh báo bảo mật</CardTitle>
          <CardDescription>
            Thông báo về các hành vi đáng ngờ khi làm bài thi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {securityTypes.map((type) => (
            <div key={type.key} className="flex items-center justify-between py-2">
              <div>
                <Label htmlFor={type.key} className="font-medium cursor-pointer">
                  {type.label}
                </Label>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
              <Switch
                id={type.key}
                checked={preferences[type.key as keyof NotificationPreference] as boolean}
                onCheckedChange={(checked) =>
                  updatePreference(type.key as keyof NotificationPreference, checked)
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={fetchPreferences} disabled={saving}>
          Đặt lại
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Lưu cài đặt
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
