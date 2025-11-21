import { IsOptional, IsEnum, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum NotificationType {
  EXAM_CREATED = 'EXAM_CREATED',
  EXAM_UPDATED = 'EXAM_UPDATED',
  EXAM_REMINDER = 'EXAM_REMINDER',
  EXAM_STARTED = 'EXAM_STARTED',
  EXAM_ENDING = 'EXAM_ENDING',
  EXAM_ENDED = 'EXAM_ENDED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  TAB_SWITCH_WARNING = 'TAB_SWITCH_WARNING',
  SCREEN_SHARING_DETECTED = 'SCREEN_SHARING_DETECTED',
  COPY_PASTE_ATTEMPT = 'COPY_PASTE_ATTEMPT',
  IP_VIOLATION = 'IP_VIOLATION',
  FINGERPRINT_MISMATCH = 'FINGERPRINT_MISMATCH',
  SYSTEM = 'SYSTEM',
  GRADE_PUBLISHED = 'GRADE_PUBLISHED',
  ATTEMPT_SUBMITTED = 'ATTEMPT_SUBMITTED',
}

export class QueryNotificationsDto {
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRead?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}
