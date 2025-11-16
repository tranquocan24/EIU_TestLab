import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  @Post()
  create(@Request() req, @Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(req.user.userId, createMessageDto);
  }

  @Get('conversations')
  getConversations(@Request() req) {
    return this.messagesService.getConversations(req.user.userId);
  }

  @Get('conversation/:userId')
  getConversation(@Request() req, @Param('userId') otherUserId: string) {
    return this.messagesService.getConversation(req.user.userId, otherUserId);
  }

  @Get('unread-count')
  getUnreadCount(@Request() req) {
    return this.messagesService.getUnreadCount(req.user.userId);
  }

  @Put('mark-read/:senderId')
  markAsRead(@Request() req, @Param('senderId') senderId: string) {
    return this.messagesService.markAsRead(req.user.userId, senderId);
  }
}
