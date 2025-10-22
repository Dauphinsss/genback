import { Module } from '@nestjs/common';
import { PrivilegesService } from './privileges.service';
import { PrivilegesController } from './privileges.controller';

@Module({
  controllers: [PrivilegesController],
  providers: [PrivilegesService],
  exports: [PrivilegesService],
})
export class PrivilegesModule {}
