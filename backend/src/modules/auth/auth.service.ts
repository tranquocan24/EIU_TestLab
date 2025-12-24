import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '@/common/prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) { }

  async register(dto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: dto.username },
          { email: dto.email },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Generate initial session ID
    const sessionId = randomUUID();

    // Create user
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: hashedPassword,
        email: dto.email,
        name: dto.name,
        role: dto.role || 'STUDENT',
        sessionId,
        lastLoginAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        courses: true,
        coursesEnrolled: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Generate token with session ID
    const token = await this.signToken(user.id, user.username, user.role, sessionId);

    // Map coursesEnrolled to courses array for backward compatibility
    const courseCodes = user.coursesEnrolled?.map(e => e.course.code) || [];

    return {
      user: {
        ...user,
        courses: courseCodes,
      },
      access_token: token,
    };
  }

  async login(dto: LoginDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      include: {
        coursesEnrolled: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate new session ID
    const sessionId = randomUUID();

    // Update user session in database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        sessionId,
        lastLoginAt: new Date(),
      },
    });

    // Generate token with session ID
    const token = await this.signToken(user.id, user.username, user.role, sessionId);

    // Map coursesEnrolled to courses array for backward compatibility
    const courseCodes = user.coursesEnrolled?.map(e => e.course.code) || [];

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        courses: courseCodes,
      },
      access_token: token,
    };
  }

  async signToken(userId: string, username: string, role: string, sessionId: string): Promise<string> {
    const payload = {
      sub: userId,
      username,
      role,
      sessionId,
    };

    return this.jwt.signAsync(payload);
  }
}
