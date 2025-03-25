import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpCode, UsePipes, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { RequestContextPipe } from 'src/utils/pipes/request-context.pipe';
import { Request, Response } from 'express';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @UsePipes(RequestContextPipe)
  async signUp(@Body() signUpDto: SignUpDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return await this.authService.signUp(signUpDto)
  }

  @Post('signin')
  @UsePipes(RequestContextPipe)
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signInDto: SignInDto) {
    return await this.authService.signIn(signInDto)
  }

  @Post('verify-otp')
  @UsePipes(RequestContextPipe)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
      const metadata = req['context'];
      console.log(metadata);
      
      const accessToken = await this.authService.verifyOtp(verifyOtpDto, metadata, res); // Pass res here
  
      res.status(HttpStatus.OK).json({ message: 'OTP verified successfully' });
  }  
}
