import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class MarkReadDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  notificationIds?: string[]; // If empty, mark all as read
}
