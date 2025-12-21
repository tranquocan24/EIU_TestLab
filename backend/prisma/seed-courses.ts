import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCourses() {
  console.log('🌱 Seeding courses...');

  const courses = [
    {
      code: 'CSE301',
      name: 'Lập trình Web',
      description: 'Học HTML, CSS, JavaScript và các framework hiện đại',
    },
    {
      code: 'CSE302',
      name: 'Cơ sở dữ liệu',
      description: 'SQL, NoSQL, thiết kế và quản trị cơ sở dữ liệu',
    },
    {
      code: 'CSE303',
      name: 'Lập trình hướng đối tượng',
      description: 'OOP với Java và C++',
    },
    {
      code: 'CSE304',
      name: 'Cấu trúc dữ liệu và giải thuật',
      description: 'Các cấu trúc dữ liệu cơ bản và thuật toán',
    },
    {
      code: 'CSE305',
      name: 'Mạng máy tính',
      description: 'Kiến thức về network, protocols, security',
    },
    {
      code: 'CSE405',
      name: 'Phát triển ứng dụng di động',
      description: 'React Native, Flutter, Android/iOS development',
    },
  ];

  for (const course of courses) {
    try {
      const existing = await prisma.course.findUnique({
        where: { code: course.code },
      });

      if (existing) {
        console.log(`⏭️  Course ${course.code} already exists, skipping...`);
        continue;
      }

      await prisma.course.create({
        data: course,
      });
      console.log(`✅ Created course: ${course.code} - ${course.name}`);
    } catch (error) {
      console.error(`❌ Error creating course ${course.code}:`, error);
    }
  }

  console.log('✨ Courses seeding completed!');
}

seedCourses()
  .catch((e) => {
    console.error('Error seeding courses:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
