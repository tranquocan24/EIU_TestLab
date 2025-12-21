import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AttemptsService } from './attempts.service';
import { StartAttemptDto, SubmitAnswerDto, SubmitAttemptDto, GradeEssayDto } from './dto';

@Controller('attempts')
@UseGuards(JwtAuthGuard)
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) { }

  @Post('start')
  async startAttempt(@Body() dto: StartAttemptDto, @GetUser('id') userId: string) {
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
  getAttempt(@Param('id') id: string, @GetUser() user: any) {
    return this.attemptsService.getAttempt(id, user.id, user.role);
  }

  @Get('exam/:examId')
  getExamAttempts(@Param('examId') examId: string) {
    return this.attemptsService.getExamAttempts(examId);
  }

  @Delete(':id')
  deleteAttempt(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.attemptsService.deleteAttempt(id, userId);
  }

  // Teacher endpoints for grading essay questions
  @Put(':attemptId/grade/:questionId')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  gradeEssayAnswer(
    @Param('attemptId') attemptId: string,
    @Param('questionId') questionId: string,
    @Body() dto: GradeEssayDto,
    @GetUser('id') teacherId: string,
  ) {
    return this.attemptsService.gradeEssayAnswer(attemptId, questionId, dto.points, teacherId);
  }

  @Get('grading/pending')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  getAttemptsNeedingGrading(@GetUser('id') teacherId: string) {
    return this.attemptsService.getAttemptsNeedingGrading(teacherId);
  }
}
