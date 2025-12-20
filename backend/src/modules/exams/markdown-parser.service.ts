import { Injectable, BadRequestException } from '@nestjs/common';

interface ParsedExam {
  title: string;
  subject: string;
  duration: number;
  description?: string;
  questions: ParsedQuestion[];
}

interface ParsedQuestion {
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'TEXT';
  points: number;
  order: number;
  options: ParsedOption[];
  correctAnswer?: string; // For TEXT type, this is sample answer
}

interface ParsedOption {
  text: string;
  isCorrect: boolean;
  order: number;
}

@Injectable()
export class MarkdownParserService {
  /**
   * Parse markdown content to exam data
   */
  parseMarkdownToExam(markdownContent: string): ParsedExam {
    if (!markdownContent || markdownContent.trim().length === 0) {
      throw new BadRequestException('Nội dung markdown không được để trống');
    }

    // Validate markdown format
    this.validateMarkdown(markdownContent);

    // Parse header information
    const header = this.parseHeader(markdownContent);

    // Parse questions
    const questions = this.parseQuestions(markdownContent);

    return {
      ...header,
      questions,
    };
  }

  /**
   * Validate markdown format
   */
  validateMarkdown(content: string): void {
    // Check if content has title (starts with #)
    if (!content.match(/^#\s+.+/m)) {
      throw new BadRequestException('Markdown phải có tiêu đề (bắt đầu với #)');
    }

    // Check if has at least one question (## Câu)
    if (!content.match(/^##\s+Câu\s+\d+/m)) {
      throw new BadRequestException('Markdown phải có ít nhất một câu hỏi (## Câu 1:...)');
    }

    // Check for required metadata
    if (!content.match(/\*\*Môn học:\*\*/)) {
      throw new BadRequestException('Thiếu thông tin "Môn học"');
    }

    if (!content.match(/\*\*Thời gian:\*\*/)) {
      throw new BadRequestException('Thiếu thông tin "Thời gian"');
    }
  }

  /**
   * Parse header information (title, subject, duration, description)
   */
  private parseHeader(content: string): Omit<ParsedExam, 'questions'> {
    // Extract title (first # heading)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled Exam';

    // Extract subject
    const subjectMatch = content.match(/\*\*Môn học:\*\*\s*(.+)/);
    const subject = subjectMatch ? subjectMatch[1].trim() : 'Unknown';

    // Extract duration (in minutes)
    const durationMatch = content.match(/\*\*Thời gian:\*\*\s*(\d+)\s*phút/);
    const duration = durationMatch ? parseInt(durationMatch[1], 10) : 60;

    // Extract description (optional)
    const descriptionMatch = content.match(/\*\*Mô tả:\*\*\s*(.+)/);
    const description = descriptionMatch ? descriptionMatch[1].trim() : undefined;

    return {
      title,
      subject,
      duration,
      description,
    };
  }

  /**
   * Parse all questions from markdown
   */
  private parseQuestions(content: string): ParsedQuestion[] {
    // Split content by question headers (## Câu X:)
    // Capture everything until next question or end of content
    const questionRegex = /##\s+Câu\s+(\d+):[^\n]*\n([\s\S]+?)(?=\n##\s+Câu\s+\d+:|$)/g;
    const matches = Array.from(content.matchAll(questionRegex));

    if (matches.length === 0) {
      throw new BadRequestException('Không tìm thấy câu hỏi nào trong markdown');
    }

    console.log(`[DEBUG] Found ${matches.length} questions to parse`);

    return matches.map((match, index) => {
      const questionNumber = parseInt(match[1], 10);
      let questionContent = match[2].trim();
      
      // Remove trailing separator (---) if exists
      questionContent = questionContent.replace(/\n*---\s*$/g, '').trim();
      
      console.log(`[DEBUG] Parsing question ${questionNumber}, content length: ${questionContent.length}`);
      console.log(`[DEBUG] First 200 chars: ${questionContent.substring(0, 200)}`);

      return this.parseQuestion(questionContent, questionNumber || index + 1);
    });
  }

  /**
   * Parse a single question
   */
  private parseQuestion(content: string, order: number): ParsedQuestion {
    // Extract question type
    const typeMatch = content.match(/\*\*Loại:\*\*\s*(multiple-choice|multiple-select|text)/i);
    const typeStr = typeMatch ? typeMatch[1].toLowerCase() : 'multiple-choice';

    let questionType: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'TEXT';
    if (typeStr === 'multiple-select') {
      questionType = 'MULTIPLE_SELECT';
    } else if (typeStr === 'text') {
      questionType = 'TEXT';
    } else {
      questionType = 'MULTIPLE_CHOICE';
    }

    // Extract points
    const pointsMatch = content.match(/\*\*Điểm:\*\*\s*(\d+)/);
    const points = pointsMatch ? parseInt(pointsMatch[1], 10) : 1;

    // Extract question text - stop before options or answer
    const questionTextMatch = content.match(/\*\*Điểm:\*\*\s*\d+\s*\n+(.+?)(?=\n-\s+[A-Z]\.|\n\*\*Đáp án)/s);
    const questionText = questionTextMatch ? questionTextMatch[1].trim() : 'No question text';

    // Parse options and correct answer
    let options: ParsedOption[] = [];
    let correctAnswer: string | undefined;

    if (questionType === 'TEXT') {
      // For text questions, extract sample answer
      const answerMatch = content.match(/\*\*Đáp án mẫu:\*\*\s*\n(.+)/s);
      correctAnswer = answerMatch ? answerMatch[1].trim() : undefined;
    } else {
      // Extract correct answer(s)
      const answerMatch = content.match(/\*\*Đáp án:\*\*\s*([A-Z,\s]+)/);
      const correctAnswers = answerMatch
        ? answerMatch[1].split(',').map(a => a.trim())
        : [];

      // Extract options - flexible regex to handle spaces and line breaks
      // Match: "- A. text" or "-A. text" or "- A.text"
      const optionMatches = Array.from(content.matchAll(/-\s*([A-Z])\.\s*([^\n]+)/g));
      
      console.log(`[DEBUG] Câu ${order}: Found ${optionMatches.length} options`);
      
      options = optionMatches.map((match, idx) => {
        const optionLetter = match[1];
        const optionText = match[2].trim();
        const isCorrect = correctAnswers.includes(optionLetter);

        return {
          text: optionText,
          isCorrect,
          order: idx + 1,
        };
      });

      if (options.length === 0) {
        console.error(`[ERROR] Câu ${order}: Không parse được options. Content:\n${content.substring(0, 200)}`);
        throw new BadRequestException(`Câu ${order}: Không tìm thấy đáp án cho câu hỏi trắc nghiệm`);
      }
    }

    return {
      questionText,
      questionType,
      points,
      order,
      options,
      correctAnswer,
    };
  }
}
