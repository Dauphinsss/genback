import { Module } from '@nestjs/common';
import { PrivilegesService } from './privileges.service';
import { PrivilegesController } from './privileges.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PrivilegesController],
  providers: [PrivilegesService, PrismaService],
  exports: [PrivilegesService],
})
export class PrivilegesModule {}
