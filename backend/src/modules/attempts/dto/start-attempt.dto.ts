import { IsString, IsNotEmpty } from 'class-validator';

export class StartAttemptDto {
  @IsString()
  @IsNotEmpty()
  examId: string;
}
