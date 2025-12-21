import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  code: string; // CSE301, CSE302, etc.

  @IsString()
  @IsNotEmpty()
  name: string; // Lập trình Web, Cơ sở dữ liệu, etc.

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
