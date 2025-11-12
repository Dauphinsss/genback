import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { PrivilegesModule } from './privileges/privileges.module';
import { UsersModule } from './users/users.module';
import { UnitsModule } from './course-b/units/units.module';
import { LessonsModule } from './course-b/lessons/lessons.module';
import { TopicsModule } from './topics/topics.module';
import { ContentModule } from './content/content.module';
import { CourseBModule } from './course-b/course-b.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    AuthModule,
    PrivilegesModule,
    UsersModule,
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UnitsModule,
    LessonsModule,
    CourseBModule,
    TopicsModule,
    ContentModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
