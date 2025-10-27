import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createQuestionDto: CreateQuestionDto) {
    const { options, ...questionData } = createQuestionDto;

    return this.prisma.question.create({
      data: {
        ...questionData,
        options: {
          create: options,
        },
      },
      include: {
        options: true,
      },
    });
  }

  async findByExam(examId: string) {
    return this.prisma.question.findMany({
      where: { examId },
      include: {
        options: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    const { options, ...questionData } = updateQuestionDto;

    // If options are provided, delete old ones and create new ones
    if (options) {
      await this.prisma.questionOption.deleteMany({
        where: { questionId: id },
      });
    }

    return this.prisma.question.update({
      where: { id },
      data: {
        ...questionData,
        ...(options && {
          options: {
            create: options,
          },
        }),
      },
      include: {
        options: true,
      },
    });
  }

  async remove(id: string) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    return this.prisma.question.delete({ where: { id } });
  }
}
