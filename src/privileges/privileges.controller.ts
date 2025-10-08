import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrivilegesService } from './privileges.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('privileges')
export class PrivilegesController {
  constructor(private readonly privilegesService: PrivilegesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.privilegesService.getPrivileges();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyPrivileges(@Req() req) {
    const userId = req.user.id;
    return this.privilegesService.getUserPrivileges(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() body: { name: string; description?: string; category?: string },
  ) {
    return this.privilegesService.createPrivilege(
      body.name,
      body.description,
      body.category,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('assign')
  async assign(@Body() body: { userId: number; privilegeId: number }) {
    return this.privilegesService.assignPrivilege(
      body.userId,
      body.privilegeId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('remove')
  async remove(@Body() body: { userId: number; privilegeId: number }) {
    return this.privilegesService.removePrivilege(
      body.userId,
      body.privilegeId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.privilegesService.deletePrivilege(parseInt(id));
  }
}
