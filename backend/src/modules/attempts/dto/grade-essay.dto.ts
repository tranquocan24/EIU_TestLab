import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

export class GradeEssayDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  points: number;
}
