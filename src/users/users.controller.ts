import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GCSService } from './gcs.service';
import * as multer from 'multer';

@UseGuards(JwtAuthGuard)
@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly gcsService: GCSService,
  ) {}

  // GET /users
  @Get('users')
  async findAll() {
    return this.usersService.getAllUsersWithPrivileges();
  }

  // GET /api/me
  @Get('api/me')
  async getProfile(@Req() req) {
    return this.usersService.findById(req.user.id);
  }

  // PATCH /api/me
  @Patch('api/me')
  async updateProfile(
    @Req() req,
    @Body() dto: { name?: string; avatar?: string },
  ) {
    return this.usersService.updateMe(req.user.id, dto);
  }

  // POST /api/me/avatar
  @Post('api/me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(@Req() req, @UploadedFile() file: Express.Multer.File) {
    const url = await this.gcsService.uploadFile(file, req.user.id);
    const user = await this.usersService.updateAvatar(req.user.id, url);
    return { success: true, avatar: url, user };
  }
}
