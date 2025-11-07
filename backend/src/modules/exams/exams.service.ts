import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateExamDto, UpdateExamDto } from './dto';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(userId?: string, userRole?: string, userCourses?: string) {
    // Build where condition based on user role
    let whereCondition: any = {};

    // If student, filter by allowedCourses matching student's courses
    if (userRole === 'STUDENT' && userCourses) {
      const studentCoursesArray = userCourses.split(',').map(c => c.trim());

      // Find exams where allowedCourses contains at least one of student's courses
      whereCondition.OR = studentCoursesArray.map(course => ({
        allowedCourses: {
          contains: course
        }
      }));

      // Only show published exams to students
      whereCondition.status = 'PUBLISHED';
    }

    // If teacher, filter by exams they created
    if (userRole === 'TEACHER' && userId) {
      whereCondition.createdById = userId;
    }

    // Admin sees all exams (no filter)

    return this.prisma.exam.findMany({
      where: whereCondition,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        questions: {
          include: {
            options: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    // Transform data to match frontend expectations
    const transformedExam = {
      ...exam,
      questions: exam.questions.map(q => ({
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
    };

    return transformedExam;
  }

  async create(createExamDto: CreateExamDto, userId: string) {
    const { questions, ...examData } = createExamDto;

    return this.prisma.exam.create({
      data: {
        ...examData,
        createdById: userId,
        questions: questions
          ? {
            create: questions.map((q, index) => ({
              question: q.questionText,
              type: q.questionType || 'multiple-choice',
              points: q.points || 10,
              order: q.order !== undefined ? q.order : index + 1,
              options: {
                create: q.options.map((opt, optIndex) => ({
                  option: opt.text,
                  isCorrect: opt.isCorrect,
                  order: optIndex + 1,
                })),
              },
            })),
          }
          : undefined,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        questions: {
          include: {
            options: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async update(id: string, updateExamDto: UpdateExamDto) {
    const exam = await this.prisma.exam.findUnique({ where: { id } });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    return this.prisma.exam.update({
      where: { id },
      data: updateExamDto,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id } });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    return this.prisma.exam.delete({ where: { id } });
  }
}
