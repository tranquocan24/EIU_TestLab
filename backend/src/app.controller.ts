import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      message: 'Welcome to Online Exam System API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        auth: '/auth',
        users: '/users',
        exams: '/exams',
        questions: '/questions',
        attempts: '/attempts',
      },
      docs: '/api-docs (coming soon)',
    };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
