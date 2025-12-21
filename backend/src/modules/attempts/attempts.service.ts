import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { SubmitAnswerDto } from './dto';

@Injectable()
export class AttemptsService {
  constructor(private readonly prisma: PrismaService) { }

  async startAttempt(examId: string, userId: string) {
    // Check if exam exists
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }

    // Check if exam is archived
    if (exam.status === 'ARCHIVED') {
      throw new BadRequestException('This exam has been archived and is no longer available for taking. You can only view results.');
    }

    // Check if exam has questions
    if (!exam.questions || exam.questions.length === 0) {
      throw new BadRequestException('This exam has no questions');
    }

    // Check exam time constraints
    const now = new Date();

    if (exam.startTime && new Date(exam.startTime) > now) {
      throw new BadRequestException('Exam has not started yet');
    }

    if (exam.endTime && new Date(exam.endTime) < now) {
      throw new BadRequestException('Exam has ended');
    }

    // Check number of attempts
    const previousAttempts = await this.prisma.attempt.findMany({
      where: {
        studentId: userId,
        examId,
        status: { in: ['SUBMITTED', 'GRADED'] }
      },
      orderBy: {
        attemptNumber: 'desc'
      }
    });

    // Check if max attempts exceeded
    if (exam.maxAttempts !== null && exam.maxAttempts !== undefined) {
      if (previousAttempts.length >= exam.maxAttempts) {
        throw new BadRequestException(`You have reached the maximum number of attempts (${exam.maxAttempts}) for this exam`);
      }
    }

    // Check if user has an in-progress attempt
    const inProgressAttempt = await this.prisma.attempt.findFirst({
      where: {
        studentId: userId,
        examId,
        status: 'IN_PROGRESS'
      },
    });

    // If already has in-progress attempt, return it
    if (inProgressAttempt) {
      return inProgressAttempt;
    }

    // Calculate next attempt number
    const nextAttemptNumber = previousAttempts.length > 0
      ? previousAttempts[0].attemptNumber + 1
      : 1;

    // Create new attempt
    const attempt = await this.prisma.attempt.create({
      data: {
        studentId: userId,
        examId,
        status: 'IN_PROGRESS',
        attemptNumber: nextAttemptNumber,
      },
      include: {
        exam: {
          include: {
            questions: {
              include: {
                options: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });

    try {
      const transformedAttempt = {
        ...attempt,
        exam: {
          ...attempt.exam,
          questions: attempt.exam.questions.map(q => ({
            id: q.id,
            questionText: q.question,
            type: q.type,
            points: q.points,
            order: q.order,
            options: q.options.map(opt => ({
              id: opt.id,
              text: opt.option,
              isCorrect: opt.isCorrect,
              order: opt.order,
            })),
          })),
        },
      };

      return transformedAttempt;
    } catch (transformError) {
      throw transformError;
    }
  }

  async submitAnswer(attemptId: string, dto: SubmitAnswerDto, userId: string) {

    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    if (attempt.studentId !== userId) {
      throw new ForbiddenException('You can only submit answers to your own attempt');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException('This attempt has already been submitted');
    }

    // Find the question
    const question = await this.prisma.question.findUnique({
      where: { id: dto.questionId },
      include: {
        options: true,
      },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${dto.questionId} not found`);
    }

    // Check if answer is correct
    let isCorrect = false;
    let points = 0;

    // Check question type - only auto-grade multiple choice questions
    const isEssayQuestion = question.type?.toLowerCase().includes('essay') || question.type?.toLowerCase().includes('text');
    
    if (isEssayQuestion) {
      // Essay questions need manual grading - don't auto-score
      isCorrect = false; // Will be set by teacher
      points = 0; // Will be set by teacher
    } else if (dto.selectedOption) {
      // Multiple choice - auto grade
      const selectedOpt = question.options.find((opt) => opt.id === dto.selectedOption);
      if (selectedOpt?.isCorrect) {
        isCorrect = true;
        points = question.points;
      }
    }

    // Upsert answer
    const answer = await this.prisma.answer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId: dto.questionId,
        },
      },
      update: {
        selectedOption: dto.selectedOption,
        answerText: dto.answerText,
        isCorrect,
        points,
      },
      create: {
        attemptId,
        questionId: dto.questionId,
        selectedOption: dto.selectedOption,
        answerText: dto.answerText,
        isCorrect,
        points,
      },
    });

    return answer;
  }

  async submitAttempt(attemptId: string, timeSpent: number, userId: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        exam: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    if (attempt.studentId !== userId) {
      throw new ForbiddenException('You can only submit your own attempt');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException('This attempt has already been submitted');
    }

    // Check if exam has essay questions that need manual grading
    const hasEssayQuestions = attempt.exam.questions.some(
      q => q.type?.toLowerCase().includes('essay') || q.type?.toLowerCase().includes('text')
    );

    // Calculate total score (only from auto-graded questions)
    const totalPoints = attempt.answers.reduce((sum, answer) => sum + answer.points, 0);
    const maxPoints = attempt.exam.questions.reduce((sum, q) => sum + q.points, 0);
    
    // Only calculate score if no essay questions, otherwise set null (will be calculated after manual grading)
    const score = hasEssayQuestions 
      ? null 
      : (maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100 * 100) / 100 : 0);

    // Update attempt - keep as SUBMITTED if has essay questions (needs manual grading)
    const updatedAttempt = await this.prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: 'SUBMITTED', // Always SUBMITTED - will be changed to GRADED after teacher grades
        submittedAt: new Date(),
        timeSpent,
        score, // null if has essay questions
      },
      include: {
        exam: true,
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    // Create notification for the teacher who created the exam
    try {
      const student = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, username: true },
      });

      await this.prisma.notification.create({
        data: {
          userId: attempt.exam.createdById,
          type: 'ATTEMPT_SUBMITTED',
          title: `Học sinh đã nộp bài: ${attempt.exam.title}`,
          message: score !== null 
            ? `${student?.name || student?.username || 'Học sinh'} đã hoàn thành bài kiểm tra - Điểm: ${score.toFixed(1)}%`
            : `${student?.name || student?.username || 'Học sinh'} đã hoàn thành bài kiểm tra - Chờ chấm tự luận`,
          examId: attempt.exam.id,
        },
      });
    } catch (error) {
      // Silently fail - attempt was submitted successfully
      // Don't throw error - attempt was submitted successfully
    }

    return updatedAttempt;
  }

  async getStudentAttempts(userId: string) {
    const attempts = await this.prisma.attempt.findMany({
      where: { studentId: userId },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            subject: true,
            duration: true,
            passingScore: true,
          },
        },
        answers: {
          select: {
            id: true,
            isCorrect: true,
            points: true,
          },
        },
        _count: {
          select: {
            answers: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    // Calculate stats for each attempt
    return attempts.map(attempt => {
      const correctAnswers = attempt.answers.filter(a => a.isCorrect).length;

      return {
        ...attempt,
        totalQuestions: attempt._count.answers, // Use actual answered questions count
        correctAnswers,
      };
    });
  }

  async getAttempt(id: string, userId: string, userRole?: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id },
      include: {
        exam: {
          include: {
            questions: {
              include: {
                options: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            username: true,
            courses: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${id} not found`);
    }

    // Allow students to view their own attempts
    // Allow teachers to view attempts for exams they created
    const isStudent = attempt.studentId === userId;
    const isTeacherOwner = userRole === 'TEACHER' && attempt.exam.createdById === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isStudent && !isTeacherOwner && !isAdmin) {
      throw new ForbiddenException('You do not have permission to view this attempt');
    }

    // Transform data to ensure frontend compatibility
    const transformedAttempt = {
      ...attempt,
      exam: {
        ...attempt.exam,
        questions: attempt.exam.questions.map(q => ({
          ...q,
          questionText: q.question,
          options: q.options.map(opt => ({
            ...opt,
            text: opt.option,
          })),
        })),
      },
      answers: attempt.answers.map(ans => ({
        ...ans,
        question: {
          ...ans.question,
          questionText: ans.question.question,
          options: ans.question.options.map(opt => ({
            ...opt,
            text: opt.option,
          })),
        },
      })),
    };

    return transformedAttempt;
  }

  async getExamAttempts(examId: string) {
    return this.prisma.attempt.findMany({
      where: { examId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });
  }

  async deleteAttempt(id: string, userId: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${id} not found`);
    }

    if (attempt.studentId !== userId) {
      throw new ForbiddenException('You can only delete your own attempt');
    }

    await this.prisma.attempt.delete({
      where: { id },
    });

    return { message: 'Attempt deleted successfully' };
  }

  // Grade essay answer (for teachers)
  async gradeEssayAnswer(attemptId: string, questionId: string, points: number, teacherId: string) {
    console.log('[gradeEssayAnswer] Starting...', { attemptId, questionId, points, teacherId });

    // Get attempt with exam info
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: true,
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    // Verify teacher owns this exam
    if (attempt.exam.createdById !== teacherId) {
      throw new ForbiddenException('You can only grade attempts for your own exams');
    }

    // Find the question
    const question = attempt.exam.questions.find(q => q.id === questionId);
    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found in this exam`);
    }

    // Validate points don't exceed question max points
    if (points > question.points) {
      throw new BadRequestException(`Points (${points}) cannot exceed question max points (${question.points})`);
    }

    // Update the answer
    const answer = await this.prisma.answer.update({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      data: {
        points,
        isCorrect: points > 0, // Consider correct if got any points
      },
    });

    console.log('[gradeEssayAnswer] Answer graded successfully');

    // Check if all essay questions have been graded
    const allAnswers = await this.prisma.answer.findMany({
      where: { attemptId },
      include: {
        question: true,
      },
    });

    const essayQuestions = allAnswers.filter(
      a => a.question.type?.toLowerCase().includes('essay') || a.question.type?.toLowerCase().includes('text')
    );

    const allEssaysGraded = essayQuestions.every(a => a.points !== null && a.points !== undefined);

    console.log('[gradeEssayAnswer] Grading status:', {
      totalEssays: essayQuestions.length,
      graded: essayQuestions.filter(a => a.points > 0).length,
      allGraded: allEssaysGraded
    });

    // If all essays are graded, calculate final score and update status to GRADED
    if (allEssaysGraded) {
      const totalPoints = allAnswers.reduce((sum, ans) => sum + (ans.points || 0), 0);
      const maxPoints = attempt.exam.questions.reduce((sum, q) => sum + q.points, 0);
      const finalScore = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100 * 100) / 100 : 0;

      await this.prisma.attempt.update({
        where: { id: attemptId },
        data: {
          status: 'GRADED',
          score: finalScore,
        },
      });

      console.log('[gradeEssayAnswer] All essays graded. Final score:', finalScore);
    }

    return {
      success: true,
      message: 'Essay answer graded successfully',
      data: answer,
      allGraded: allEssaysGraded,
    };
  }

  // Get attempts that need grading (have essay questions)
  async getAttemptsNeedingGrading(teacherId: string) {
    console.log('[getAttemptsNeedingGrading] Teacher ID:', teacherId);

    // Get teacher's exams
    const teacherExams = await this.prisma.exam.findMany({
      where: { createdById: teacherId },
      select: { id: true },
    });

    const examIds = teacherExams.map(e => e.id);

    // Get SUBMITTED attempts for teacher's exams
    const attempts = await this.prisma.attempt.findMany({
      where: {
        examId: { in: examIds },
        status: 'SUBMITTED', // Only submitted, not graded yet
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        exam: {
          select: {
            id: true,
            title: true,
            subject: true,
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    // Filter to only attempts with essay questions
    const attemptsWithEssays = attempts.filter(attempt =>
      attempt.answers.some(
        ans => ans.question.type?.toLowerCase().includes('essay') ||
          ans.question.type?.toLowerCase().includes('text')
      )
    );

    console.log('[getAttemptsNeedingGrading] Found attempts:', attemptsWithEssays.length);

    return attemptsWithEssays;
  }
}

