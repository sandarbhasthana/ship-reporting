import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { password, ...rest } = createUserDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        ...rest,
        passwordHash,
      },
      include: {
        organization: true,
        assignedVessel: true,
      },
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async findAll(organizationId?: string) {
    const where = organizationId ? { organizationId } : {};

    const users = await this.prisma.user.findMany({
      where,
      include: {
        organization: true,
        assignedVessel: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(({ passwordHash, ...user }) => user);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: true,
        assignedVessel: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    const { password, ...rest } = updateUserDto;

    const data: any = { ...rest };

    // If password is being updated, hash it
    if (password) {
      const saltRounds = 10;
      data.passwordHash = await bcrypt.hash(password, saltRounds);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        organization: true,
        assignedVessel: true,
      },
    });

    const { passwordHash, ...result } = user;
    return result;
  }

  async remove(id: string) {
    await this.findOne(id);

    // Soft delete by setting isActive to false
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }
}

