import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { SubmitAnswerDto } from './dto';

@Injectable()
export class AttemptsService {
  constructor(private readonly prisma: PrismaService) { }

  async startAttempt(examId: string, userId: string) {
    console.log('[startAttempt] Called with:', { examId, userId });

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

    console.log('[startAttempt] Exam found:', {
      found: !!exam,
      id: exam?.id,
      title: exam?.title,
      questionCount: exam?.questions?.length || 0,
      maxAttempts: exam?.maxAttempts,
    });

    if (!exam) {
      console.error('[startAttempt] Exam not found:', examId);
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }

    // Check if exam has questions
    if (!exam.questions || exam.questions.length === 0) {
      console.error('[startAttempt] Exam has no questions:', {
        examId: exam.id,
        title: exam.title,
      });
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

    console.log('[startAttempt] Previous attempts:', previousAttempts.length);

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
      console.log('[startAttempt] Returning existing in-progress attempt:', inProgressAttempt.id);
      return inProgressAttempt;
    }

    console.log('[startAttempt] Creating new attempt...');

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

    console.log('[startAttempt] New attempt created:', {
      id: attempt.id,
      questionCount: attempt.exam.questions.length,
    });

    try {
      // Transform data to match frontend expectations
      const transformedAttempt = {
        ...attempt,
        exam: {
          ...attempt.exam,
          questions: attempt.exam.questions.map(q => ({
            id: q.id,
            questionText: q.question, // Map 'question' to 'questionText'
            type: q.type,
            points: q.points,
            order: q.order,
            options: q.options.map(opt => ({
              id: opt.id,
              text: opt.option, // Map 'option' to 'text'
              isCorrect: opt.isCorrect,
              order: opt.order,
            })),
          })),
        },
      };

      console.log('[startAttempt] Transformed new attempt successfully');
      return transformedAttempt;
    } catch (transformError) {
      console.error('[startAttempt] Error transforming new attempt:', transformError);
      throw transformError;
    }
  }

  async submitAnswer(attemptId: string, dto: SubmitAnswerDto, userId: string) {
    console.log('[submitAnswer] Starting...')
    console.log('Attempt ID:', attemptId)
    console.log('User ID:', userId)
    console.log('DTO:', dto)

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
      console.error('[submitAnswer] Attempt not found:', attemptId)
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    console.log('[submitAnswer] Found attempt:', {
      id: attempt.id,
      studentId: attempt.studentId,
      status: attempt.status
    })

    if (attempt.studentId !== userId) {
      console.error('[submitAnswer] User mismatch. Expected:', attempt.studentId, 'Got:', userId)
      throw new ForbiddenException('You can only submit answers to your own attempt');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      console.error('[submitAnswer] Invalid status:', attempt.status)
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
      console.error('[submitAnswer] Question not found:', dto.questionId)
      throw new NotFoundException(`Question with ID ${dto.questionId} not found`);
    }

    console.log('[submitAnswer] Found question:', question.id)

    // Check if answer is correct
    let isCorrect = false;
    let points = 0;

    if (dto.selectedOption) {
      const selectedOpt = question.options.find((opt) => opt.id === dto.selectedOption);
      console.log('[submitAnswer] Selected option:', dto.selectedOption)
      console.log('[submitAnswer] Found option:', selectedOpt)
      if (selectedOpt?.isCorrect) {
        isCorrect = true;
        points = question.points;
      }
    }

    console.log('[submitAnswer] Answer evaluation:', { isCorrect, points })

    // Upsert answer
    console.log('[submitAnswer] Upserting answer...')
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

    console.log('[submitAnswer] ✓ Answer saved:', answer.id)
    return answer;
  }

  async submitAttempt(attemptId: string, timeSpent: number, userId: string) {
    console.log('[submitAttempt] Starting...')
    console.log('Attempt ID:', attemptId)
    console.log('User ID:', userId)
    console.log('Time spent:', timeSpent)

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
      console.error('[submitAttempt] Attempt not found:', attemptId)
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    console.log('[submitAttempt] Found attempt:', {
      id: attempt.id,
      studentId: attempt.studentId,
      status: attempt.status,
      answersCount: attempt.answers.length
    })

    if (attempt.studentId !== userId) {
      console.error('[submitAttempt] User mismatch. Expected:', attempt.studentId, 'Got:', userId)
      throw new ForbiddenException('You can only submit your own attempt');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      console.error('[submitAttempt] Invalid status:', attempt.status)
      throw new BadRequestException('This attempt has already been submitted');
    }

    // Calculate total score
    const totalPoints = attempt.answers.reduce((sum, answer) => sum + answer.points, 0);
    const maxPoints = attempt.exam.questions.reduce((sum, q) => sum + q.points, 0);
    const score = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

    console.log('[submitAttempt] Score calculation:', {
      totalPoints,
      maxPoints,
      score,
      percentage: `${score.toFixed(2)}%`
    })

    // Update attempt
    console.log('[submitAttempt] Updating attempt status to SUBMITTED...')
    const updatedAttempt = await this.prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        timeSpent,
        score,
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

    console.log('[submitAttempt] ✓ Attempt submitted successfully')
    console.log('Final score:', updatedAttempt.score)
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

  async getAttempt(id: string, userId: string) {
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
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${id} not found`);
    }

    if (attempt.studentId !== userId) {
      throw new ForbiddenException('You can only view your own attempt');
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
}
