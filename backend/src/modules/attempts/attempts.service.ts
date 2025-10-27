import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { SubmitAnswerDto } from './dto';

@Injectable()
export class AttemptsService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Check if user already has an attempt
    const existingAttempt = await this.prisma.attempt.findUnique({
      where: {
        studentId_examId: {
          studentId: userId,
          examId,
        },
      },
    });

    if (existingAttempt) {
      throw new BadRequestException('You have already attempted this exam');
    }

    // Create new attempt
    const attempt = await this.prisma.attempt.create({
      data: {
        studentId: userId,
        examId,
        status: 'IN_PROGRESS',
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

    return attempt;
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

    if (dto.selectedOption) {
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

    // Calculate total score
    const totalPoints = attempt.answers.reduce((sum, answer) => sum + answer.points, 0);
    const maxPoints = attempt.exam.questions.reduce((sum, q) => sum + q.points, 0);
    const score = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

    // Update attempt
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

    return updatedAttempt;
  }

  async getStudentAttempts(userId: string) {
    return this.prisma.attempt.findMany({
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
      },
      orderBy: {
        startedAt: 'desc',
      },
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

    return attempt;
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
}
