import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AttemptsService } from './attempts.service';
import { StartAttemptDto, SubmitAnswerDto, SubmitAttemptDto } from './dto';

@Controller('attempts')
@UseGuards(JwtAuthGuard)
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post('start')
  startAttempt(@Body() dto: StartAttemptDto, @GetUser('id') userId: string) {
    return this.attemptsService.startAttempt(dto.examId, userId);
  }

  @Put(':id/answer')
  submitAnswer(
    @Param('id') attemptId: string,
    @Body() dto: SubmitAnswerDto,
    @GetUser('id') userId: string,
  ) {
    return this.attemptsService.submitAnswer(attemptId, dto, userId);
  }

  @Put(':id/submit')
  submitAttempt(
    @Param('id') attemptId: string,
    @Body() dto: SubmitAttemptDto,
    @GetUser('id') userId: string,
  ) {
    return this.attemptsService.submitAttempt(attemptId, dto.timeSpent, userId);
  }

  @Get('my-attempts')
  getMyAttempts(@GetUser('id') userId: string) {
    return this.attemptsService.getStudentAttempts(userId);
  }

  @Get(':id')
  getAttempt(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.attemptsService.getAttempt(id, userId);
  }

  @Get('exam/:examId')
  getExamAttempts(@Param('examId') examId: string) {
    return this.attemptsService.getExamAttempts(examId);
  }
}
