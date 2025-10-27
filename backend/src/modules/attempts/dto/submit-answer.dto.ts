import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsOptional()
  selectedOption?: string;

  @IsString()
  @IsOptional()
  answerText?: string;
}
