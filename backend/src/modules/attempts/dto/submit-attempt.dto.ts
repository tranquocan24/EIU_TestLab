import { IsInt } from 'class-validator';

export class SubmitAttemptDto {
  @IsInt()
  timeSpent: number; // in seconds
}
