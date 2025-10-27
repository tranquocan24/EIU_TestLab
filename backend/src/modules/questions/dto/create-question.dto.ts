import { IsString, IsNotEmpty, IsInt, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreateQuestionOptionDto {
  @IsString()
  @IsNotEmpty()
  option: string;

  @IsOptional()
  isCorrect?: boolean;

  @IsInt()
  @IsOptional()
  order?: number;
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsInt()
  @IsOptional()
  points?: number;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsString()
  @IsNotEmpty()
  examId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options: CreateQuestionOptionDto[];
}
