import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Request,
  Response,
  Get,
  UnauthorizedException
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/auth.dto';
import { CreateUserDto } from '../users/dto/user.dto';
import { RegisterCandidateDto } from '../users/dto/candidate.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Response as ExpressResponse } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() createUserDto: CreateUserDto,
    @Response() res: ExpressResponse,
  ) {
    const result = await this.authService.register(createUserDto);
    
    // Set session key in HTTP-only cookie
    res.cookie('session_key', result.sessionKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      message: 'User registered successfully',
      accessToken: result.accessToken,
      expiresAt: result.expiresAt,
    });
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Response() res: ExpressResponse) {
    const result = await this.authService.login(loginDto);
    
    // Set session key in HTTP-only cookie
    res.cookie('session_key', result.sessionKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      message: 'Login successful',
      accessToken: result.accessToken,
      expiresAt: result.expiresAt,
    });
  }

  @Post('refresh')
  async refreshToken(
    @Request() req,
    @Response() res: ExpressResponse,
  ) {
    const sessionKey = req.cookies?.session_key;
    if (!sessionKey) {
      throw new UnauthorizedException('No session key found');
    }

    const result = await this.authService.refreshToken(sessionKey);
    
    // Update session key in cookie
    res.cookie('session_key', result.sessionKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      message: 'Token refreshed successfully',
      accessToken: result.accessToken,
      expiresAt: result.expiresAt,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Request() req,
    @Response() res: ExpressResponse,
  ) {
    const sessionKey = req.cookies?.session_key;
    if (sessionKey) {
      await this.authService.logout(sessionKey);
    }

    res.clearCookie('session_key');
    return res.json({ message: 'Logout successful' });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return { userId: req.user.id, sessionKey: req.user.sessionKey };
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: { token: string; newPassword: string }) {
    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
  }

  @Post('register-candidate')
  async registerCandidate(@Body() registerCandidateDto: RegisterCandidateDto) {
    return this.authService.registerCandidate(registerCandidateDto);
  }
}
