import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class EnrollUsersDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  userIds: string[]; // Array of user IDs to enroll
}
