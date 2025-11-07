import { IsString, IsEmail, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  courses?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
