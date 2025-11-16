import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCourses() {
  console.log('🔄 Checking and fixing user courses...');

  // Get all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      courses: true,
    },
  });

  let updated = 0;

  for (const user of users) {
    // If courses is null or empty array, assign some default courses based on username pattern
    if (!user.courses || user.courses.length === 0) {
      let defaultCourses: string[] = [];

      if (user.role === 'STUDENT') {
        // Assign default courses based on username pattern
        // Example: student1 -> CIT0001, student2 -> CIT0002, etc.
        const match = user.username.match(/\d+/);
        if (match) {
          const num = parseInt(match[0]);
          const courseNum = ((num - 1) % 5) + 1; // Distribute between CIT0001-CIT0005
          defaultCourses = [`CIT000${courseNum}`];
        } else {
          // Default fallback
          defaultCourses = ['CIT0001'];
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { courses: defaultCourses },
        });

        console.log(`✅ Updated ${user.username} (${user.role}) with courses: ${defaultCourses.join(', ')}`);
        updated++;
      }
    } else {
      console.log(`⏭️  Skipped ${user.username} (${user.role}) - already has courses: ${user.courses.join(', ')}`);
    }
  }

  console.log(`\n✨ Fixed ${updated} users`);
}

fixCourses()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
