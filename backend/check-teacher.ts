import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTeacher() {
  const teacher = await prisma.user.findUnique({
    where: { username: 'teacher1' },
    include: {
      coursesEnrolled: {
        include: {
          course: true,
        },
      },
    },
  });

  console.log('Teacher1 data:');
  console.log('- Name:', teacher?.name);
  console.log('- Role:', teacher?.role);
  console.log('- Old courses field:', teacher?.courses);
  console.log('- Enrolled courses count:', teacher?.coursesEnrolled.length);
  console.log('- Enrolled courses:', teacher?.coursesEnrolled.map(e => e.course.code).join(', '));

  await prisma.$disconnect();
}

checkTeacher();
