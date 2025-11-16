import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) { }

  // Send message
  async create(senderId: string, createMessageDto: CreateMessageDto) {
    return this.prisma.message.create({
      data: {
        senderId,
        receiverId: createMessageDto.receiverId,
        content: createMessageDto.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
    });
  }

  // Get conversation between two users
  async getConversation(userId: string, otherUserId: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  // Get all conversations for a user (list of people they've chatted with)
  async getConversations(userId: string) {
    // Get all messages where user is sender or receiver
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by other user and get latest message
    const conversationsMap = new Map();

    messages.forEach((message) => {
      const otherUser =
        message.senderId === userId ? message.receiver : message.sender;

      if (!conversationsMap.has(otherUser.id)) {
        conversationsMap.set(otherUser.id, {
          user: otherUser,
          lastMessage: message,
          unreadCount: 0,
        });
      }

      // Count unread messages (messages sent to current user that are unread)
      if (message.receiverId === userId && !message.isRead) {
        const conv = conversationsMap.get(otherUser.id);
        conv.unreadCount++;
      }
    });

    return Array.from(conversationsMap.values());
  }

  // Mark messages as read
  async markAsRead(userId: string, senderId: string) {
    return this.prisma.message.updateMany({
      where: {
        senderId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  // Get unread messages count
  async getUnreadCount(userId: string) {
    return this.prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });
  }
}
