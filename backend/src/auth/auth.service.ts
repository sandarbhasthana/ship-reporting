import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto, RegisterDto } from './dto';
import { RoleName } from '@ship-reporting/prisma';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  async login(loginDto: LoginDto, ip?: string, userAgent?: string) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
        assignedVessel: true,
      },
    });

    if (!user) {
      // Log failed login attempt (user not found)
      await this.auditService.log(
        'Auth',
        'unknown',
        'LOGIN_FAILED',
        null,
        { email, reason: 'User not found' },
        { ip, userAgent },
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      // Log failed login attempt (account disabled)
      await this.auditService.log(
        'Auth',
        user.id,
        'LOGIN_FAILED',
        null,
        { email, reason: 'Account disabled' },
        {
          userId: user.id,
          organizationId: user.organizationId ?? undefined,
          ip,
          userAgent,
        },
      );
      throw new UnauthorizedException('Account is disabled');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      // Log failed login attempt (invalid password)
      await this.auditService.log(
        'Auth',
        user.id,
        'LOGIN_FAILED',
        null,
        { email, reason: 'Invalid password' },
        {
          userId: user.id,
          organizationId: user.organizationId ?? undefined,
          ip,
          userAgent,
        },
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      assignedVesselId: user.assignedVesselId,
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _hash, ...userWithoutPassword } = user;

    // Log successful login
    await this.auditService.log(
      'Auth',
      user.id,
      'LOGIN',
      null,
      { email, role: user.role },
      {
        userId: user.id,
        organizationId: user.organizationId ?? undefined,
        ip,
        userAgent,
      },
    );

    return {
      access_token: this.jwtService.sign(payload),
      user: userWithoutPassword,
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, name, role, organizationId, assignedVesselId } =
      registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role || RoleName.CAPTAIN,
        organizationId,
        assignedVesselId,
      },
      include: {
        organization: true,
        assignedVessel: true,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _pw, ...userWithoutPassword } = user;

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      assignedVesselId: user.assignedVesselId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: userWithoutPassword,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
        assignedVessel: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _pwd, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ip?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      // Log failed password change attempt
      await this.auditService.log(
        'Auth',
        userId,
        'PASSWORD_CHANGE_FAILED',
        null,
        { reason: 'Invalid current password' },
        {
          userId,
          organizationId: user.organizationId ?? undefined,
          ip,
          userAgent,
        },
      );
      throw new UnauthorizedException('Current password is incorrect');
    }

    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Log successful password change
    await this.auditService.log(
      'Auth',
      userId,
      'PASSWORD_CHANGE',
      null,
      { success: true },
      {
        userId,
        organizationId: user.organizationId ?? undefined,
        ip,
        userAgent,
      },
    );

    return { message: 'Password changed successfully' };
  }
}
