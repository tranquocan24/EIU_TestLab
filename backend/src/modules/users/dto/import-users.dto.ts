import { IsString, IsNotEmpty, IsEnum, IsEmail, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

export class ImportUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
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
  courses?: string; // Danh sách lớp (ví dụ: "CSE301,CSE302")
}
