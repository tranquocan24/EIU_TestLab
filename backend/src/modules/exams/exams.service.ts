import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateExamDto, UpdateExamDto } from './dto';
import { MarkdownParserService } from './markdown-parser.service';
import { CourseHelper } from '@/common/helpers/course.helper';

@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly markdownParser: MarkdownParserService,
  ) { }

  async findAll(userId?: string, userRole?: string) {
    // Build where condition based on user role
    let whereCondition: any = {};

    // If student, use CourseHelper to get accessible exams
    if (userRole === 'STUDENT' && userId) {
      // Get user's course codes from both old and new system
      const studentCoursesArray = await CourseHelper.getUserCourseCodes(userId);

      if (studentCoursesArray.length > 0) {
        // Find exams where allowedCourses contains at least one of student's courses
        whereCondition.OR = [
          // Exams with no course restriction
          { allowedCourses: null },
          { allowedCourses: '' },
          // Exams matching student's courses
          ...studentCoursesArray.map(course => ({
            allowedCourses: {
              contains: course
            }
          }))
        ];
      }

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
        }
      } catch (error) {
        console.error('Error creating notifications:', error);
        // Don't throw error - exam was created successfully
      }
    }

    // Create notification for the teacher who created the exam
    try {
      await this.prisma.notification.create({
        data: {
          userId: userId,
          type: 'EXAM_CREATED',
          title: `Đã tạo bài kiểm tra: ${examData.title}`,
          message: examData.status === 'PUBLISHED' 
            ? `Bài kiểm tra đã được xuất bản - ${examData.subject}` 
            : `Bài kiểm tra đang ở trạng thái nháp - ${examData.subject}`,
          examId: exam.id,
        },
      });
    } catch (error) {
      console.error('Error creating teacher notification:', error);
      // Don't throw error - exam was created successfully
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

    await this.prisma.exam.delete({ where: { id } });

    return {
      success: true,
      message: 'Exam deleted successfully',
      data: null,
    };
  }

  /**
   * Duplicate an existing exam with all its questions and options
   */
  async duplicate(id: string, userId: string) {
    // Find the original exam with all questions and options
    const originalExam = await this.prisma.exam.findUnique({
      where: { id },
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
    });

    if (!originalExam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    // Create a new exam with duplicated data
    const duplicatedExam = await this.prisma.exam.create({
      data: {
        title: `${originalExam.title} (Bản sao)`,
        subject: originalExam.subject,
        duration: originalExam.duration,
        description: originalExam.description,
        status: 'DRAFT', // Always set duplicated exams to DRAFT
        allowedCourses: originalExam.allowedCourses,
        maxAttempts: originalExam.maxAttempts,
        passingScore: originalExam.passingScore,
        createdById: userId,
        questions: {
          create: originalExam.questions.map((q) => ({
            question: q.question,
            type: q.type,
            points: q.points,
            order: q.order,
            options: {
              create: q.options.map((opt) => ({
                option: opt.option,
                isCorrect: opt.isCorrect,
                order: opt.order,
              })),
            },
          })),
        },
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

    // Create notification for the teacher
    try {
      await this.prisma.notification.create({
        data: {
          userId: userId,
          type: 'EXAM_CREATED',
          title: `Đã nhân bản bài kiểm tra: ${duplicatedExam.title}`,
          message: `Bản sao của "${originalExam.title}" đã được tạo`,
          examId: duplicatedExam.id,
        },
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }

    return duplicatedExam;
  }

  /**
   * Parse markdown content and return exam data for preview (not saved to DB)
   */
  async parseMarkdown(markdownContent: string) {
    return this.markdownParser.parseMarkdownToExam(markdownContent);
  }

  /**
   * Import exam from markdown and save to database
   */
  async importFromMarkdown(markdownContent: string, userId: string) {
    // Parse markdown to exam data
    const parsedExam = this.markdownParser.parseMarkdownToExam(markdownContent);

    // Transform to CreateExamDto format
    const createExamDto: CreateExamDto = {
      title: parsedExam.title,
      subject: parsedExam.subject,
      duration: parsedExam.duration,
      description: parsedExam.description,
      status: 'DRAFT', // Default to draft when importing
      questions: parsedExam.questions.map((q) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        points: q.points,
        order: q.order,
        options: q.options.map((opt) => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
          order: opt.order,
        })),
      })),
    };

    // Save to database using existing create method
    return this.create(createExamDto, userId);
  }

  /**
   * Archive an exam - prevents new attempts, only results can be viewed
   */
  async archiveExam(examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }

    if (exam.status === 'ARCHIVED') {
      throw new BadRequestException('Exam is already archived');
    }

    const updatedExam = await this.prisma.exam.update({
      where: { id: examId },
      data: { status: 'ARCHIVED' },
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
    });

    return {
      message: 'Exam has been archived successfully. Students can no longer take this exam.',
      exam: updatedExam,
    };
  }
}
