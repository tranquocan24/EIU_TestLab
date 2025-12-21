import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Helper functions to work with both old courses (string[]) 
 * and new CourseEnrollment system
 */

export class CourseHelper {
  /**
   * Get all course codes for a user (combines old and new system)
   */
  static async getUserCourseCodes(userId: string): Promise<string[]> {
    // Get from new enrollment system
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId },
      include: { course: true },
    });

    const courseCodes = enrollments.map((e) => e.course.code);

    // Also get from old system for backward compatibility
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { courses: true },
    });

    if (user?.courses) {
      // Merge and deduplicate
      const allCodes = [...courseCodes, ...user.courses];
      return Array.from(new Set(allCodes));
    }

    return courseCodes;
  }

  /**
   * Check if user is enrolled in a course (checks both systems)
   */
  static async isUserEnrolled(
    userId: string,
    courseCode: string,
  ): Promise<boolean> {
    // Check new system
    const course = await prisma.course.findUnique({
      where: { code: courseCode },
    });

    if (course) {
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: course.id,
          },
        },
      });

      if (enrollment) return true;
    }

    // Check old system
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { courses: true },
    });

    return user?.courses?.includes(courseCode) || false;
  }

  /**
   * Check if user can access an exam based on allowedCourses
   */
  static async canUserAccessExam(
    userId: string,
    examId: string,
  ): Promise<boolean> {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { allowedCourses: true },
    });

    if (!exam) return false;

    // If no course restriction, everyone can access
    if (!exam.allowedCourses) return true;

    const allowedCourses = exam.allowedCourses
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c);

    if (allowedCourses.length === 0) return true;

    // Get user's courses
    const userCourses = await this.getUserCourseCodes(userId);

    // Check if user has any of the allowed courses
    return allowedCourses.some((allowed) => userCourses.includes(allowed));
  }

  /**
   * Get all exams accessible by a user based on their courses
   */
  static async getUserAccessibleExams(userId: string) {
    const userCourses = await this.getUserCourseCodes(userId);

    return prisma.exam.findMany({
      where: {
        OR: [
          // Exams with no course restriction
          { allowedCourses: null },
          { allowedCourses: '' },
          // Exams where user has at least one matching course
          ...userCourses.map((code) => ({
            allowedCourses: {
              contains: code,
            },
          })),
        ],
      },
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
}

export default CourseHelper;
