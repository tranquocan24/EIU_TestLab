import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating 3 accounts...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  // Xóa user cũ nếu có
  await prisma.user.deleteMany({
    where: {
      username: {
        in: ['nphau', 'giaovien', 'admin']
      }
    }
  });

  // Tạo admin
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@eiu.edu.vn',
      name: 'Administrator',
      role: 'ADMIN',
    },
  });

  // Tạo teacher
  const teacher = await prisma.user.create({
    data: {
      username: 'giaovien',
      password: hashedPassword,
      email: 'giaovien@eiu.edu.vn',
      name: 'Giáo Viên',
      role: 'TEACHER',
    },
  });

  // Tạo student
  const student = await prisma.user.create({
    data: {
      username: 'nphau',
      password: hashedPassword,
      email: 'nphau@eiu.edu.vn',
      name: 'Nguyễn Phương Hậu',
      role: 'STUDENT',
    },
  });

  console.log('✅ Created accounts successfully!');
  console.log('\n📋 Account Details:');
  console.log('-----------------------------------');
  console.log(`👤 Student: ${student.username} (${student.name})`);
  console.log(`👨‍🏫 Teacher: ${teacher.username} (${teacher.name})`);
  console.log(`👨‍💼 Admin:   ${admin.username} (${admin.name})`);
  console.log('-----------------------------------');
  console.log('🔑 Password: 123456 (for all accounts)');
  console.log('\n🎉 Done!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
