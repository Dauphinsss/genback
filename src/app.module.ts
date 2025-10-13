import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { PrivilegesModule } from './privileges/privileges.module';
import { UsersModule } from './users/users.module';
import { UnitsModule } from './units/units.module';
import { LessonsModule } from './lessons/lessons.module';

@Module({
  imports: [
    AuthModule,
    PrivilegesModule,
    UsersModule,
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UnitsModule,
    LessonsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
