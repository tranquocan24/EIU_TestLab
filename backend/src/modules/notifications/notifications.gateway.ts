import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets = new Map<number, string>(); // userId -> socketId
  private socketUsers = new Map<string, number>(); // socketId -> userId

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake auth or query
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;

      // Check if user already has an active connection
      const existingSocketId = this.userSockets.get(userId);
      if (existingSocketId) {
        // Disconnect the old session
        const oldSocket = this.server.sockets.sockets.get(existingSocketId);
        if (oldSocket) {
          this.logger.warn(`🔄 User ${userId} logging in from new device. Kicking old session ${existingSocketId}`);
          
          // Emit session-kicked event to old client
          oldSocket.emit('session-kicked', {
            message: 'Bạn đã đăng nhập ở thiết bị khác',
            timestamp: new Date().toISOString(),
          });
          
          // Disconnect old socket after a short delay to ensure message is delivered
          setTimeout(() => {
            oldSocket.disconnect(true);
          }, 100);
        }
        
        // Clean up old mappings
        this.socketUsers.delete(existingSocketId);
      }

      // Store user socket mapping
      this.userSockets.set(userId, client.id);
      this.socketUsers.set(client.id, userId);
      client.data.userId = userId;

      // Join user to their personal room
      client.join(`user:${userId}`);

      this.logger.log(`✅ User ${userId} connected (${client.id})`);

      // Send welcome message
      client.emit('connected', {
        message: 'Connected to notification server',
        userId,
      });
    } catch (error) {
      this.logger.error(`Authentication failed for ${client.id}:`, error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      // Only delete if this is the current socket for this user
      if (this.userSockets.get(userId) === client.id) {
        this.userSockets.delete(userId);
      }
      this.socketUsers.delete(client.id);
      this.logger.log(`❌ User ${userId} disconnected (${client.id})`);
    }
  }

  // Send notification to specific user
  sendToUser(userId: number, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
    this.logger.debug(`📤 Sent '${event}' to user ${userId}`);
  }

  // Send notification to multiple users
  sendToUsers(userIds: number[], event: string, data: any) {
    userIds.forEach((userId) => this.sendToUser(userId, event, data));
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.debug(`📡 Broadcast '${event}' to all users`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: Date.now() } };
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
  ) {
    client.join(room);
    this.logger.log(`User ${client.data.userId} joined room: ${room}`);
    return { event: 'joinedRoom', data: { room } };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
  ) {
    client.leave(room);
    this.logger.log(`User ${client.data.userId} left room: ${room}`);
    return { event: 'leftRoom', data: { room } };
  }
}
