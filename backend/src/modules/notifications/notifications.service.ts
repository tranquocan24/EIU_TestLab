import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmailService } from './email.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';
import { NotificationChannel } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) { }

  // Create notification with enhanced features
  async create(createNotificationDto: CreateNotificationDto) {
    const { channels = [NotificationChannel.IN_APP], ...data } = createNotificationDto;

    const notification = await this.prisma.notification.create({
      data: {
        ...data,
        channels,
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            subject: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Send email notification if EMAIL channel is enabled
    if (channels.includes(NotificationChannel.EMAIL) && notification.user.email) {
      // Get user preferences
      const preferences = await this.getPreferences(notification.userId);

      if (preferences.enableEmail) {
        // Send email asynchronously (don't wait for it)
        this.emailService
          .sendNotificationEmail(
            notification.user.email,
            notification.type,
            notification.title,
            notification.message,
            notification.metadata,
          )
          .then(() => {
            // Update notification to mark email as sent
            this.prisma.notification.update({
              where: { id: notification.id },
              data: {
                sentViaEmail: true,
                emailSentAt: new Date(),
              },
            });
          })
          .catch((error) => {
            console.error('Failed to send email notification:', error);
          });
      }
    }

    return notification;
  }

  // Get notifications with filtering and pagination
  async findAllByUser(userId: string, query: QueryNotificationsDto) {
    const { type, isRead, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    console.log('🔍 Finding notifications for userId:', userId, 'query:', query);

    const where: any = { userId };
    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          exam: {
            select: {
              id: true,
              title: true,
              subject: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    console.log('📊 Found notifications:', notifications.length, 'total:', total);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get unread count
  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  // Mark notifications as read (single or multiple)
  async markAsRead(userId: string, markReadDto: MarkReadDto) {
    const { notificationIds } = markReadDto;

    const where: any = {
      userId,
      isRead: false,
    };

    if (notificationIds && notificationIds.length > 0) {
      where.id = { in: notificationIds };
    }

    return this.prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  // Delete notification
  async remove(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.delete({
      where: { id },
    });
  }

  // Delete all read notifications
  async deleteAllRead(userId: string) {
    return this.prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
      },
    });
  }

  // Get user's notification preferences
  async getPreferences(userId: string) {
    let preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Create default preferences if not exists
    if (!preferences) {
      preferences = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return preferences;
  }

  // Update notification preferences
  async updatePreferences(userId: string, updateDto: UpdateNotificationPreferenceDto) {
    // Ensure preferences exist
    await this.getPreferences(userId);

    return this.prisma.notificationPreference.update({
      where: { userId },
      data: updateDto,
    });
  }

  // Create notification for all students in courses
  async createForStudentsInCourses(courses: string[], notificationData: Omit<CreateNotificationDto, 'userId'>) {
    // Get all students in these courses
    const students = await this.prisma.user.findMany({
      where: {
        role: 'STUDENT',
        courses: {
          hasSome: courses,
        },
      },
      select: {
        id: true,
      },
    });

    // Create notification for each student
    const notifications = await Promise.all(
      students.map(student =>
        this.create({
          ...notificationData,
          userId: student.id,
        })
      )
    );

    return notifications;
  }

  // Create notification for specific users
  async createForUsers(userIds: string[], notificationData: Omit<CreateNotificationDto, 'userId'>) {
    const notifications = await Promise.all(
      userIds.map(userId =>
        this.create({
          ...notificationData,
          userId,
        })
      )
    );

    return notifications;
  }

  // Get notification statistics for user
  async getStats(userId: string) {
    const [total, unread, byType] = await Promise.all([
      this.prisma.notification.count({
        where: { userId },
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
      this.prisma.notification.groupBy({
        by: ['type'],
        where: { userId },
        _count: true,
      }),
    ]);

    return {
      total,
      unread,
      read: total - unread,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
