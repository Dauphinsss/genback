import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getAllUsersWithPrivileges() {
    const users = await this.prisma.user.findMany({
      include: {
        privileges: {
          include: {
            privilege: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      privileges: user.privileges.map((up) => up.privilege),
    }));
  }

  async findById(userId: string | number) {
    const numericUserId = Number(userId);
    const user = await this.prisma.user.findUnique({
      where: { id: numericUserId },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async updateMe(userId: string, dto: { name?: string; avatar?: string }) {
    const numericUserId = Number(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: numericUserId },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    return this.prisma.user.update({
      where: { id: numericUserId },
      data: {
        name: dto.name,
        avatar: dto.avatar,
      },
    });
  }

  async updateAvatar(userId: string | number, avatarUrl: string) {
    const numericUserId = Number(userId);
    const user = await this.prisma.user.findUnique({
      where: { id: numericUserId },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.prisma.user.update({
      where: { id: numericUserId },
      data: { avatar: avatarUrl },
    });
  }
}
