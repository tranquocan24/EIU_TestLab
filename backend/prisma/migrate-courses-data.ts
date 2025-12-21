import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCoursesData() {
  console.log('🔄 Starting courses migration...');

  try {
    // Step 1: Collect all unique course codes from users and exams
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        courses: true,
      },
    });

    const exams = await prisma.exam.findMany({
      select: {
        id: true,
        title: true,
        allowedCourses: true,
      },
    });

    const courseCodesSet = new Set<string>();

    // Collect from users
    for (const user of users) {
      if (user.courses && user.courses.length > 0) {
        user.courses.forEach((code) => courseCodesSet.add(code.trim()));
      }
    }

    // Collect from exams
    for (const exam of exams) {
      if (exam.allowedCourses) {
        const codes = exam.allowedCourses.split(',').map((c) => c.trim());
        codes.forEach((code) => {
          if (code) courseCodesSet.add(code);
        });
      }
    }

    console.log(`📚 Found ${courseCodesSet.size} unique course codes`);

    // Step 2: Create Course records for codes that don't exist yet
    const courseCodes = Array.from(courseCodesSet).sort();
    const createdCourses: { code: string; id: string }[] = [];

    for (const code of courseCodes) {
      // Check if course already exists
      let course = await prisma.course.findUnique({
        where: { code },
      });

      if (!course) {
        // Create new course with default name
        const name = getCourseName(code);
        course = await prisma.course.create({
          data: {
            code,
            name,
            description: `Course ${code}`,
            isActive: true,
          },
        });
        console.log(`✅ Created course: ${code} - ${name}`);
        createdCourses.push({ code: course.code, id: course.id });
      } else {
        console.log(`⏭️  Course ${code} already exists`);
        createdCourses.push({ code: course.code, id: course.id });
      }
    }

    // Step 3: Create CourseEnrollment records
    let enrollmentCount = 0;

    for (const user of users) {
      if (!user.courses || user.courses.length === 0) continue;

      for (const courseCode of user.courses) {
        const code = courseCode.trim();
        const course = createdCourses.find((c) => c.code === code);

        if (!course) {
          console.warn(`⚠️  Course ${code} not found for user ${user.username}`);
          continue;
        }

        // Check if enrollment already exists
        const existingEnrollment = await prisma.courseEnrollment.findUnique({
          where: {
            userId_courseId: {
              userId: user.id,
              courseId: course.id,
            },
          },
        });

        if (!existingEnrollment) {
          await prisma.courseEnrollment.create({
            data: {
              userId: user.id,
              courseId: course.id,
            },
          });
          enrollmentCount++;
        }
      }
    }

    console.log(`✅ Created ${enrollmentCount} course enrollments`);

    // Step 4: Verify migration
    const totalCourses = await prisma.course.count();
    const totalEnrollments = await prisma.courseEnrollment.count();

    console.log('\n📊 Migration Summary:');
    console.log(`   Total Courses: ${totalCourses}`);
    console.log(`   Total Enrollments: ${totalEnrollments}`);
    console.log(`   New Courses Created: ${createdCourses.length}`);
    console.log(`   New Enrollments Created: ${enrollmentCount}`);

    // Step 5: Show enrollment breakdown by course
    console.log('\n📋 Enrollment Breakdown:');
    for (const course of createdCourses) {
      const count = await prisma.courseEnrollment.count({
        where: { courseId: course.id },
      });
      console.log(`   ${course.code}: ${count} users`);
    }

    console.log('\n✨ Migration completed successfully!');
    console.log('\n💡 Note: Old courses field in User table is kept for backward compatibility.');
    console.log('   Use coursesEnrolled relation for new features.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Helper function to generate course name from code
function getCourseName(code: string): string {
  // Map of known course codes to names
  const knownCourses: Record<string, string> = {
    CSE301: 'Lập trình Web',
    CSE302: 'Cơ sở dữ liệu',
    CSE303: 'Lập trình hướng đối tượng',
    CSE304: 'Cấu trúc dữ liệu và giải thuật',
    CSE305: 'Mạng máy tính',
    CSE306: 'Phát triển phần mềm',
    CSE405: 'Phát triển ứng dụng di động',
    CSE101: 'Nhập môn Khoa học Máy tính',
  };

  return knownCourses[code] || `Course ${code}`;
}

// Main execution
migrateCoursesData()
  .catch((e) => {
    console.error('Migration error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
