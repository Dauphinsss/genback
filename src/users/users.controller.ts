import { Controller, Get, Patch, Body, Req, UseGuards, Post, UseInterceptors, UploadedFile} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GCSService } from './gcs.service';
import * as multer from 'multer';

@Controller('api/me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService, private gcsService: GCSService) {}

  @Get()
  async getProfile(@Req() req) {
    return this.usersService.findById(req.user.id);
  }

  @Patch()
  async updateProfile(@Req() req, @Body() dto: { name?: string; avatar?: string }) {
    return this.usersService.updateMe(req.user.id, dto);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar', { 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } 
  }))
  @UseGuards(JwtAuthGuard)
  async uploadAvatar(@Req() req, @UploadedFile() file: Express.Multer.File) {
    const url = await this.gcsService.uploadFile(file, req.user.id);
    const user = await this.usersService.updateAvatar(req.user.id, url);
    return { success: true, avatar: url, user };
  }
}
