import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ExamsService } from './exams.service';
import { CreateExamDto, UpdateExamDto } from './dto';

@Controller('exams')
@UseGuards(JwtAuthGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) { }

  @Get()
  findAll(@GetUser() user: any) {
    return this.examsService.findAll(user.id, user.role, user.courses);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  create(@Body() createExamDto: CreateExamDto, @GetUser('id') userId: string) {
    return this.examsService.create(createExamDto, userId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  update(@Param('id') id: string, @Body() updateExamDto: UpdateExamDto) {
    return this.examsService.update(id, updateExamDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.examsService.remove(id);
  }
}
