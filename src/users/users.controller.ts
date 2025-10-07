import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async getProfile(@Req() req) {
    return this.usersService.findById(req.user.id);
  }

  @Patch()
  async updateProfile(@Req() req, @Body() dto: { name?: string; avatar?: string }) {
    return this.usersService.updateMe(req.user.id, dto);
  }
}
