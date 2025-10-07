import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async updateMe (userId: string, dto: {name?: string, avatar?: string}) {

    const numericUserId = Number(userId);

    const user = await this.prisma.user.findUnique({ where: { id: numericUserId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    return this.prisma.user.update({
      where: { id: numericUserId },
      data: {
        name: dto.name,
        avatar: dto.avatar,
      },
    });
  }
}