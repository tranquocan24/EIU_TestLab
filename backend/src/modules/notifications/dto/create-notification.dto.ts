import { IsString, IsOptional, IsEnum, IsArray, IsObject } from 'class-validator';
import { NotificationType, NotificationChannel, NotificationPriority } from '@prisma/client';

export class CreateNotificationDto {
  @IsString()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];

  @IsOptional()
  @IsString()
  examId?: string;

  @IsOptional()
  @IsString()
  attemptId?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}
