import { IsString, IsEmail, IsEnum, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @IsOptional()
  courses?: string;
}
