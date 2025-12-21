import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { EnrollUsersDto } from './dto/enroll-users.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCourseDto: CreateCourseDto) {
    // Check if course code already exists
    const existing = await this.prisma.course.findUnique({
      where: { code: createCourseDto.code },
    });

    if (existing) {
      throw new ConflictException(`Course with code ${createCourseDto.code} already exists`);
    }

    return this.prisma.course.create({
      data: createCourseDto,
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.course.findMany({
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        code: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                role: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    // Check if course exists
    await this.findOne(id);

    // If updating code, check for conflicts
    if (updateCourseDto.code) {
      const existing = await this.prisma.course.findUnique({
        where: { code: updateCourseDto.code },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(`Course with code ${updateCourseDto.code} already exists`);
      }
    }

    return this.prisma.course.update({
      where: { id },
      data: updateCourseDto,
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string) {
    // Check if course exists
    await this.findOne(id);

    return this.prisma.course.delete({
      where: { id },
    });
  }

  // Enroll users to a course
  async enrollUsers(courseId: string, enrollUsersDto: EnrollUsersDto) {
    // Check if course exists
    await this.findOne(courseId);

    // Check if all users exist
    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: enrollUsersDto.userIds,
        },
      },
    });

    if (users.length !== enrollUsersDto.userIds.length) {
      throw new NotFoundException('Some users not found');
    }

    // Get existing enrollments
    const existingEnrollments = await this.prisma.courseEnrollment.findMany({
      where: {
        courseId,
        userId: {
          in: enrollUsersDto.userIds,
        },
      },
    });

    const existingUserIds = new Set(existingEnrollments.map((e) => e.userId));

    // Create new enrollments for users not already enrolled
    const newUserIds = enrollUsersDto.userIds.filter(
      (userId) => !existingUserIds.has(userId),
    );

    if (newUserIds.length === 0) {
      return {
        message: 'All users are already enrolled in this course',
        enrolled: 0,
        alreadyEnrolled: enrollUsersDto.userIds.length,
      };
    }

    const enrollments = await this.prisma.courseEnrollment.createMany({
      data: newUserIds.map((userId) => ({
        userId,
        courseId,
      })),
    });

    return {
      message: `Successfully enrolled ${enrollments.count} user(s)`,
      enrolled: enrollments.count,
      alreadyEnrolled: existingUserIds.size,
    };
  }

  // Unenroll users from a course
  async unenrollUsers(courseId: string, enrollUsersDto: EnrollUsersDto) {
    // Check if course exists
    await this.findOne(courseId);

    const result = await this.prisma.courseEnrollment.deleteMany({
      where: {
        courseId,
        userId: {
          in: enrollUsersDto.userIds,
        },
      },
    });

    return {
      message: `Successfully unenrolled ${result.count} user(s)`,
      unenrolled: result.count,
    };
  }

  // Get all users enrolled in a course
  async getEnrolledUsers(courseId: string) {
    await this.findOne(courseId);

    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            role: true,
            email: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        user: {
          name: 'asc',
        },
      },
    });

    return enrollments.map((e) => e.user);
  }

  // Get all users NOT enrolled in a course
  async getAvailableUsers(courseId: string) {
    await this.findOne(courseId);

    const enrolledUserIds = await this.prisma.courseEnrollment.findMany({
      where: { courseId },
      select: { userId: true },
    });

    const enrolledIds = enrolledUserIds.map((e) => e.userId);

    return this.prisma.user.findMany({
      where: {
        id: {
          notIn: enrolledIds,
        },
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        email: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
