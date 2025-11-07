import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) { }

  @Get('dashboard')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getDashboardStats() {
    return this.statsService.getDashboardStats();
  }

  @Get('login-history')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getLoginStats(@Query('days') days?: string) {
    const daysCount = days ? Number.parseInt(days, 10) : 7;
    return this.statsService.getLoginStats(daysCount);
  }

  @Get('exams')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getExamStats() {
    return this.statsService.getExamStats();
  }
}
