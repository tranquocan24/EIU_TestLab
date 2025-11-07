import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.answer.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Create users với password 12345678
  const hashedPassword = await bcrypt.hash('12345678', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@eiu.edu.vn',
      name: 'System Administrator',
      role: 'ADMIN',
    },
  });

  const teacher1 = await prisma.user.create({
    data: {
      username: 'teacher1',
      password: hashedPassword,
      email: 'teacher1@eiu.edu.vn',
      name: 'Nguyễn Văn An',
      role: 'TEACHER',
      courses: 'CSE301,CSE302', // Teacher dạy 2 lớp
    },
  });

  const student1 = await prisma.user.create({
    data: {
      username: 'student1',
      password: hashedPassword,
      email: 'student1@eiu.edu.vn',
      name: 'Lê Văn Cường',
      role: 'STUDENT',
      courses: 'CSE301', // Student học lớp CSE301
    },
  });

  console.log('✅ Created users:', {
    admin: admin.username,
    teacher: teacher1.username,
    student: student1.username,
  });

  // Create exams với allowedCourses
  const exam1 = await prisma.exam.create({
    data: {
      title: 'Bài kiểm tra giữa kỳ - Lập trình Web',
      description: 'Kiểm tra kiến thức về HTML, CSS, JavaScript cơ bản',
      subject: 'Web Development',
      duration: 60,
      passingScore: 70,
      status: 'PUBLISHED',
      allowedCourses: 'CSE301', // Chỉ CSE301 được làm
      startTime: new Date('2025-10-20T08:00:00Z'),
      endTime: new Date('2025-11-30T23:59:59Z'),
      createdById: teacher1.id,
    },
  });

  const exam2 = await prisma.exam.create({
    data: {
      title: 'Bài thi cuối kỳ - Cơ sở dữ liệu',
      description: 'Kiểm tra toàn diện về SQL, ERD, Normalization',
      subject: 'Database Management',
      duration: 90,
      passingScore: 60,
      status: 'PUBLISHED',
      allowedCourses: 'CSE302', // Chỉ CSE302
      startTime: new Date('2025-10-25T08:00:00Z'),
      endTime: new Date('2025-12-15T23:59:59Z'),
      createdById: teacher1.id,
    },
  });

  const exam3 = await prisma.exam.create({
    data: {
      title: 'Bài tập thực hành - OOP',
      description: 'Các câu hỏi về lập trình hướng đối tượng',
      subject: 'Object Oriented Programming',
      duration: 45,
      passingScore: 65,
      status: 'DRAFT',
      allowedCourses: 'CSE301,CSE302', // Cả 2 lớp
      createdById: teacher1.id,
    },
  });

  console.log('✅ Created exams:', [exam1.title, exam2.title, exam3.title]);

  // Create questions for Exam 1
  const q1 = await prisma.question.create({
    data: {
      question: 'HTML là viết tắt của từ gì?',
      type: 'multiple-choice',
      points: 10,
      order: 1,
      examId: exam1.id,
      options: {
        create: [
          { option: 'Hyper Text Markup Language', isCorrect: true, order: 1 },
          { option: 'High Tech Modern Language', isCorrect: false, order: 2 },
          { option: 'Home Tool Markup Language', isCorrect: false, order: 3 },
          { option: 'Hyperlinks and Text Markup Language', isCorrect: false, order: 4 },
        ],
      },
    },
  });

  const q2 = await prisma.question.create({
    data: {
      question: 'CSS được sử dụng để làm gì?',
      type: 'multiple-choice',
      points: 10,
      order: 2,
      examId: exam1.id,
      options: {
        create: [
          { option: 'Tạo cấu trúc trang web', isCorrect: false, order: 1 },
          { option: 'Định dạng và trang trí giao diện', isCorrect: true, order: 2 },
          { option: 'Lập trình logic nghiệp vụ', isCorrect: false, order: 3 },
          { option: 'Kết nối cơ sở dữ liệu', isCorrect: false, order: 4 },
        ],
      },
    },
  });

  const q3 = await prisma.question.create({
    data: {
      question: 'JavaScript có thể chạy ở đâu?',
      type: 'multiple-choice',
      points: 10,
      order: 3,
      examId: exam1.id,
      options: {
        create: [
          { option: 'Chỉ trên trình duyệt', isCorrect: false, order: 1 },
          { option: 'Chỉ trên server', isCorrect: false, order: 2 },
          { option: 'Cả trình duyệt và server', isCorrect: true, order: 3 },
          { option: 'Không chạy được ở đâu cả', isCorrect: false, order: 4 },
        ],
      },
    },
  });

  console.log('✅ Created questions with options');

  // Create sample attempt for student1
  await prisma.attempt.create({
    data: {
      studentId: student1.id,
      examId: exam1.id,
      status: 'SUBMITTED',
      score: 80,
      startedAt: new Date('2025-10-27T09:00:00Z'),
      submittedAt: new Date('2025-10-27T09:45:00Z'),
      timeSpent: 2700, // 45 minutes
      answers: {
        create: [
          {
            questionId: q1.id,
            selectedOption: (await prisma.questionOption.findFirst({
              where: { questionId: q1.id, isCorrect: true },
            }))?.id || '',
            isCorrect: true,
            points: 10,
          },
          {
            questionId: q2.id,
            selectedOption: (await prisma.questionOption.findFirst({
              where: { questionId: q2.id, isCorrect: true },
            }))?.id || '',
            isCorrect: true,
            points: 10,
          },
          {
            questionId: q3.id,
            selectedOption: (await prisma.questionOption.findFirst({
              where: { questionId: q3.id, isCorrect: false },
            }))?.id || '',
            isCorrect: false,
            points: 0,
          },
        ],
      },
    },
  });

  console.log('✅ Created sample attempt');

  console.log('\n🎉 Seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log('   - Users: 1 Admin, 1 Teacher, 1 Student');
  console.log('   - Exams: 3 exams (CSE301, CSE302, CSE301+302)');
  console.log('   - Questions: 3 questions for exam1');
  console.log('   - Attempts: 1 sample attempt (student1)');
  console.log('\n🔑 Login credentials:');
  console.log('   Username: admin, teacher1, student1');
  console.log('   Password: 12345678 (for all users)');
  console.log('\n📚 Course assignments:');
  console.log('   - teacher1: CSE301, CSE302');
  console.log('   - student1: CSE301');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
