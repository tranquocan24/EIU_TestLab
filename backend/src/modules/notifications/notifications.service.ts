import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) { }

  // Create notification
  async create(createNotificationDto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: createNotificationDto,
    });
  }

  // Get all notifications for a user
  async findAllByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
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
    });
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

  // Mark as read
  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id,
        userId, // Ensure user can only mark their own notifications
      },
      data: {
        isRead: true,
      },
    });
  }

  // Mark all as read
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  // Delete notification
  async remove(id: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: {
        id,
        userId, // Ensure user can only delete their own notifications
      },
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
        this.prisma.notification.create({
          data: {
            ...notificationData,
            userId: student.id,
          },
        })
      )
    );

    return notifications;
  }
}
