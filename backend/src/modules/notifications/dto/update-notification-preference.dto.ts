import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export enum EmailDigestFrequency {
  REALTIME = 'REALTIME',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

export class UpdateNotificationPreferenceDto {
  @IsOptional()
  @IsBoolean()
  enableInApp?: boolean;

  @IsOptional()
  @IsBoolean()
  enableEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  enablePush?: boolean;

  // Type preferences
  @IsOptional()
  @IsBoolean()
  examCreated?: boolean;

  @IsOptional()
  @IsBoolean()
  examUpdated?: boolean;

  @IsOptional()
  @IsBoolean()
  examReminder?: boolean;

  @IsOptional()
  @IsBoolean()
  examStarted?: boolean;

  @IsOptional()
  @IsBoolean()
  examEnding?: boolean;

  @IsOptional()
  @IsBoolean()
  examEnded?: boolean;

  @IsOptional()
  @IsBoolean()
  messageReceived?: boolean;

  @IsOptional()
  @IsBoolean()
  suspiciousActivity?: boolean;

  @IsOptional()
  @IsBoolean()
  tabSwitchWarning?: boolean;

  @IsOptional()
  @IsBoolean()
  screenSharingDetected?: boolean;

  @IsOptional()
  @IsBoolean()
  copyPasteAttempt?: boolean;

  @IsOptional()
  @IsBoolean()
  ipViolation?: boolean;

  @IsOptional()
  @IsBoolean()
  fingerprintMismatch?: boolean;

  @IsOptional()
  @IsBoolean()
  system?: boolean;

  @IsOptional()
  @IsBoolean()
  gradePublished?: boolean;

  @IsOptional()
  @IsBoolean()
  attemptSubmitted?: boolean;

  // Email digest preferences
  @IsOptional()
  @IsBoolean()
  emailDigestEnabled?: boolean;

  @IsOptional()
  @IsEnum(EmailDigestFrequency)
  emailDigestFrequency?: EmailDigestFrequency;
}
