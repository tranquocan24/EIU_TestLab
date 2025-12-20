import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  // Get all notifications with filtering and pagination
  @Get()
  findAll(@Request() req, @Query() query: QueryNotificationsDto) {
    return this.notificationsService.findAllByUser(req.user.id, query);
  }

  // Get unread count
  @Get('unread-count')
  getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  // Get notification statistics
  @Get('stats')
  getStats(@Request() req) {
    return this.notificationsService.getStats(req.user.id);
  }

  // Get user preferences
  @Get('preferences')
  getPreferences(@Request() req) {
    return this.notificationsService.getPreferences(req.user.id);
  }

  // Update user preferences
  @Put('preferences')
  updatePreferences(
    @Request() req,
    @Body() updateDto: UpdateNotificationPreferenceDto,
  ) {
    return this.notificationsService.updatePreferences(req.user.id, updateDto);
  }

  // Mark notifications as read (single or multiple)
  @Post('mark-read')
  markAsRead(@Request() req, @Body() markReadDto: MarkReadDto) {
    return this.notificationsService.markAsRead(req.user.id, markReadDto);
  }

  // Delete a specific notification
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.notificationsService.remove(id, req.user.id);
  }

  // Delete all read notifications
  @Delete('read/all')
  deleteAllRead(@Request() req) {
    return this.notificationsService.deleteAllRead(req.user.id);
  }
}
