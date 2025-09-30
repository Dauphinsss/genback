import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {}

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
}
