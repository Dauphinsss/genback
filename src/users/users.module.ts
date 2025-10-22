import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { GCSService } from './gcs.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, GCSService],
  exports: [UsersService],
})
export class UsersModule {}
