import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { EnrollUsersDto } from './dto/enroll-users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER', 'STUDENT')
  findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  // Enrollment management
  @Post(':id/enroll')
  @Roles('ADMIN')
  enrollUsers(
    @Param('id') id: string,
    @Body() enrollUsersDto: EnrollUsersDto,
  ) {
    return this.coursesService.enrollUsers(id, enrollUsersDto);
  }

  @Post(':id/unenroll')
  @Roles('ADMIN')
  unenrollUsers(
    @Param('id') id: string,
    @Body() enrollUsersDto: EnrollUsersDto,
  ) {
    return this.coursesService.unenrollUsers(id, enrollUsersDto);
  }

  @Get(':id/enrolled-users')
  @Roles('ADMIN', 'TEACHER')
  getEnrolledUsers(@Param('id') id: string) {
    return this.coursesService.getEnrolledUsers(id);
  }

  @Get(':id/available-users')
  @Roles('ADMIN')
  getAvailableUsers(@Param('id') id: string) {
    return this.coursesService.getAvailableUsers(id);
  }
}
