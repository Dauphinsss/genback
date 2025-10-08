import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrivilegesService {
  constructor(private prisma: PrismaService) {}

  async getPrivileges() {
    return this.prisma.privilege.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getUserPrivileges(userId: number) {
    const userPrivileges = await this.prisma.userPrivilege.findMany({
      where: { userId },
      include: { privilege: true },
    });

    return userPrivileges.map((up) => up.privilege);
  }

  async createPrivilege(name: string, description?: string, category?: string) {
    return this.prisma.privilege.create({
      data: {
        name,
        description,
        category: category || 'admin',
      },
    });
  }

  async assignPrivilege(userId: number, privilegeId: number) {
    const existing = await this.prisma.userPrivilege.findFirst({
      where: { userId, privilegeId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.userPrivilege.create({
      data: { userId, privilegeId },
    });
  }

  async removePrivilege(userId: number, privilegeId: number) {
    return this.prisma.userPrivilege.deleteMany({
      where: { userId, privilegeId },
    });
  }

  async deletePrivilege(id: number) {
    await this.prisma.userPrivilege.deleteMany({
      where: { privilegeId: id },
    });

    return this.prisma.privilege.delete({
      where: { id },
    });
  }
}
