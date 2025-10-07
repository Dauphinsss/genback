import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async validateOAuthLogin(
    email: string,
    name: string,
    provider: string,
    providerId: string,
    avatar?: string,
  ) {

    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: { email, name, provider, providerId, avatar },
      });
    } else {
      user =await this.prisma.user.update({
        where: { email },
        data: { provider, providerId },
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' },
    );

    return { user, token };
  }
}
