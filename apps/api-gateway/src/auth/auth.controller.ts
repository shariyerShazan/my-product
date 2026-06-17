import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.clinet';
import {
  AuthGuard,
  ChangePasswordDto,
  ForgotPassDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  VerifyRegistrationDto,
} from '@app/common';
import * as Express from 'express';
import { ResetPasswordDto } from '@app/common/dto/auth/reset-password-dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-registration')
  @ApiOperation({ summary: 'Verify Registration otp' })
  @ApiResponse({
    status: 201,
    description: "User's email verified successfully",
  })
  verifyRegistration(@Body() dto: VerifyRegistrationDto) {
    return this.authService.verifyRegistration(dto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'send otp for forgot password' })
  @ApiResponse({
    status: 201,
    description: 'opt send successfully for forgot password',
  })
  forgotPassword(@Body() dto: ForgotPassDto) {
    return this.authService.forgotPasswordRequest(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'reset you password' })
  @ApiResponse({
    status: 201,
    description: 'Password reset successfully',
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }
  //

  @Post('change-password')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  changePassword(@Req() req: Express.Request, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req?.user?.userId, dto);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  logout(@Req() req: Express.Request) {
    return this.authService.logout(req?.user?.userId);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current logged in user' })
  @ApiResponse({
    status: 200,
    description: 'Current user fetched successfully',
  })
  getMe(@Req() req: Express.Request) {
    return this.authService.getUserById(req?.user?.userId);
  }

  @Get('users')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Default is 1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Default is 10',
  })
  @ApiResponse({
    status: 200,
    description: 'Users fetched successfully',
  })
  getAllUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    return this.authService.getAllUsers(pageNum, limitNum);
  }

  @Get('users/id/:userId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({
    status: 200,
    description: 'User fetched successfully',
  })
  getUserById(@Param('userId') userId: string) {
    return this.authService.getUserById(userId);
  }

  @Get('users/email/:email')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by email' })
  @ApiResponse({
    status: 200,
    description: 'User fetched successfully',
  })
  getUserByEmail(@Param('email') email: string) {
    return this.authService.getUserByEmail(email);
  }
}
