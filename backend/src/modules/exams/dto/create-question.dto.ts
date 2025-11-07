import { IsString, IsNotEmpty, IsInt, IsArray, ValidateNested, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOptionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @IsString()
  @IsOptional()
  questionType?: string; // 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'

  @IsInt()
  @IsOptional()
  points?: number;

  @IsInt()
  order: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options: CreateOptionDto[];
}
