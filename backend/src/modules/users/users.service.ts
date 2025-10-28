import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async create(data: {
    username: string;
    password: string;
    email: string;
    name: string;
    role: UserRole;
  }) {
    // Kiểm tra username đã tồn tại chưa
    const existingUser = await this.prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Kiểm tra email đã tồn tại chưa
    if (data.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, data: {
    email?: string;
    name?: string;
    role?: UserRole;
    isActive?: boolean;
    password?: string;
  }) {
    // Kiểm tra user có tồn tại không
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Nếu cập nhật email, kiểm tra email đã tồn tại chưa
    if (data.email && data.email !== user.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    // Hash password nếu có
    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async delete(id: string) {
    // Kiểm tra user có tồn tại không
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Xóa user từ database
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully', id };
  }
}
