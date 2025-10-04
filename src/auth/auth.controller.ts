import { Controller, Get, Put, Body, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // inicio de login
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {}

  // callback
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res) {
    const { email, name, provider, providerId, avatar } = req.user;
    const { token } = await this.authService.validateOAuthLogin(
      email,
      name,
      provider,
      providerId,
      avatar,
    );
    return res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
  }

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftLogin() {}

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftCallback(@Req() req, @Res() res) {
    const { email, name, provider, providerId, avatar } = req.user;
    const { token } = await this.authService.validateOAuthLogin(
      email,
      name,
      provider,
      providerId,
      avatar,
    );
    return res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Req() req, @Body() updateData: UpdateProfileDto) {
    const userId = req.user.id;
    const updatedUser = await this.authService.updateUserProfile(userId, updateData);
    return {
      success: true,
      message: 'Perfil actualizado correctamente',
      user: updatedUser,
    };
  }
}
