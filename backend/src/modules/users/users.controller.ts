import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import { UserRole } from '@prisma/client';
import { ImportUserDto } from './dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() createUserDto: {
    username: string;
    password: string;
    email: string;
    name: string;
    role: UserRole;
    courses?: string;
  }) {
    return this.usersService.create(createUserDto);
  }

  @Post('import')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async importUsers(@Body() body: { users: ImportUserDto[] }) {
    return this.usersService.importUsers(body.users);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: {
      email?: string;
      name?: string;
      role?: UserRole;
      courses?: string;
      isActive?: boolean;
      password?: string;
    }
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
