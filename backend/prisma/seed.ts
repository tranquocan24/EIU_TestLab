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

  // Create users
  const hashedPassword = await bcrypt.hash('123456', 10);

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
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      username: 'teacher2',
      password: hashedPassword,
      email: 'teacher2@eiu.edu.vn',
      name: 'Trần Thị Bình',
      role: 'TEACHER',
    },
  });

  const students = await Promise.all([
    prisma.user.create({
      data: {
        username: 'student1',
        password: hashedPassword,
        email: 'student1@eiu.edu.vn',
        name: 'Lê Văn Cường',
        role: 'STUDENT',
      },
    }),
    prisma.user.create({
      data: {
        username: 'student2',
        password: hashedPassword,
        email: 'student2@eiu.edu.vn',
        name: 'Phạm Thị Dung',
        role: 'STUDENT',
      },
    }),
    prisma.user.create({
      data: {
        username: 'student3',
        password: hashedPassword,
        email: 'student3@eiu.edu.vn',
        name: 'Hoàng Văn Em',
        role: 'STUDENT',
      },
    }),
  ]);

  console.log('✅ Created users:', {
    admin: admin.username,
    teachers: [teacher1.username, teacher2.username],
    students: students.map(s => s.username),
  });

  // Create exams
  const exam1 = await prisma.exam.create({
    data: {
      title: 'Bài kiểm tra giữa kỳ - Lập trình Web',
      description: 'Kiểm tra kiến thức về HTML, CSS, JavaScript cơ bản',
      subject: 'Web Development',
      duration: 60,
      passingScore: 70,
      status: 'PUBLISHED',
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
      startTime: new Date('2025-10-25T08:00:00Z'),
      endTime: new Date('2025-12-15T23:59:59Z'),
      createdById: teacher2.id,
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

  // Create questions for Exam 2
  const q4 = await prisma.question.create({
    data: {
      question: 'SQL là viết tắt của gì?',
      type: 'multiple-choice',
      points: 10,
      order: 1,
      examId: exam2.id,
      options: {
        create: [
          { option: 'Structured Query Language', isCorrect: true, order: 1 },
          { option: 'Simple Question Language', isCorrect: false, order: 2 },
          { option: 'Server Query Language', isCorrect: false, order: 3 },
          { option: 'System Quality Language', isCorrect: false, order: 4 },
        ],
      },
    },
  });

  const q5 = await prisma.question.create({
    data: {
      question: 'Câu lệnh nào dùng để lấy dữ liệu từ database?',
      type: 'multiple-choice',
      points: 10,
      order: 2,
      examId: exam2.id,
      options: {
        create: [
          { option: 'GET', isCorrect: false, order: 1 },
          { option: 'SELECT', isCorrect: true, order: 2 },
          { option: 'FETCH', isCorrect: false, order: 3 },
          { option: 'RETRIEVE', isCorrect: false, order: 4 },
        ],
      },
    },
  });

  console.log('✅ Created questions with options');

  // Create some sample attempts
  const attempt1 = await prisma.attempt.create({
    data: {
      studentId: students[0].id,
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
            }))!.id,
            isCorrect: true,
            points: 10,
          },
          {
            questionId: q2.id,
            selectedOption: (await prisma.questionOption.findFirst({
              where: { questionId: q2.id, isCorrect: true },
            }))!.id,
            isCorrect: true,
            points: 10,
          },
          {
            questionId: q3.id,
            selectedOption: (await prisma.questionOption.findFirst({
              where: { questionId: q3.id, isCorrect: false },
            }))!.id,
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
  console.log('   - Users: 1 Admin, 2 Teachers, 3 Students');
  console.log('   - Exams: 3 exams');
  console.log('   - Questions: 5 questions with options');
  console.log('   - Attempts: 1 sample attempt');
  console.log('\n🔑 Login credentials:');
  console.log('   Username: admin, teacher1, teacher2, student1, student2, student3');
  console.log('   Password: 123456 (for all users)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
