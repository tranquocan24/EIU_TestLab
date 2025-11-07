import { IsString, IsNotEmpty, IsOptional, IsInt, IsDateString, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuestionDto } from './create-question.dto';

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsInt()
  duration: number; // minutes

  @IsInt()
  @IsOptional()
  passingScore?: number;

  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  @IsOptional()
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

  @IsString()
  @IsOptional()
  allowedCourses?: string; // Danh sách lớp (ví dụ: "CSE301,CSE302")

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions?: CreateQuestionDto[];
}
