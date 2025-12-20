import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateExamDto, UpdateExamDto } from './dto';

@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async findAll(userId?: string, userRole?: string, userCourses?: string | string[]) {
    // Build where condition based on user role
    let whereCondition: any = {};

    // If student, filter by allowedCourses matching student's courses
    if (userRole === 'STUDENT' && userCourses) {
      // Handle both array and string formats
      const studentCoursesArray = Array.isArray(userCourses)
        ? userCourses
        : userCourses.split(',').map(c => c.trim());

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

    // Create exam
    const exam = await this.prisma.exam.create({
      data: {
        ...examData,
        createdById: userId,
        questions: questions
          ? {
            create: questions.map((q, index) => ({
              question: q.questionText,
              type: (q.questionType || 'multiple-choice'),
              points: q.points || 10,
              order: q.order ?? index + 1,
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
      } as any,
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

    // Auto-create notifications for students in allowed courses
    if (examData.allowedCourses && examData.status === 'PUBLISHED') {
      try {
        // Parse allowedCourses (comma-separated string to array)
        const coursesArray = examData.allowedCourses.split(',').map(c => c.trim());

        // Get all students in these courses
        const students = await this.prisma.user.findMany({
          where: {
            role: 'STUDENT',
            courses: {
              hasSome: coursesArray,
            },
          },
          select: {
            id: true,
          },
        });

        // Create notification for each student
        if (students.length > 0) {
          await this.prisma.notification.createMany({
            data: students.map(student => ({
              userId: student.id,
              type: 'EXAM_CREATED',
              title: `Bài kiểm tra mới: ${examData.title}`,
              message: `${examData.subject} - ${examData.duration} phút`,
              examId: exam.id,
            })),
          });

          console.log(`✅ Created notifications for ${students.length} students`);
        }
      } catch (error) {
        console.error('Error creating notifications:', error);
        // Don't throw error - exam was created successfully
      }
    }

    return exam;
  }

  async update(id: string, updateExamDto: UpdateExamDto) {
    const exam = await this.prisma.exam.findUnique({ where: { id } });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    const { questions, ...examData } = updateExamDto;

    // If questions are provided, delete old ones and create new ones
    if (questions && questions.length > 0) {
      // First, get all question IDs for this exam
      const existingQuestions = await this.prisma.question.findMany({
        where: { examId: id },
        select: { id: true },
      });
      const questionIds = existingQuestions.map(q => q.id);

      // Delete all answers that reference these questions
      if (questionIds.length > 0) {
        await this.prisma.answer.deleteMany({
          where: { questionId: { in: questionIds } },
        });

        // Delete all question options
        await this.prisma.questionOption.deleteMany({
          where: { questionId: { in: questionIds } },
        });
      }

      // Now delete all existing questions for this exam
      await this.prisma.question.deleteMany({
        where: { examId: id },
      });

      // Create new questions with options
      for (let index = 0; index < questions.length; index++) {
        const q = questions[index];
        await this.prisma.question.create({
          data: {
            question: q.questionText,
            type: q.questionType || 'multiple-choice',
            points: q.points || 10,
            order: q.order ?? index + 1,
            examId: id,
            options: {
              create: q.options.map((opt, optIndex) => ({
                option: opt.text,
                isCorrect: opt.isCorrect,
                order: optIndex + 1,
              })),
            },
          } as any,
        });
      }
    }

    return this.prisma.exam.update({
      where: { id },
      data: examData as any,
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
            options: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
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
