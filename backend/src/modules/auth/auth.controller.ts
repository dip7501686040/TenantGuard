import { Body, Controller, Post, Get, UseGuards, Request, HttpCode, HttpStatus } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"
import { AuthService } from "./auth.service"
import { Public } from "../../common/decorators/public.decorator"
import { CurrentUser } from "../../common/decorators/user.decorator"
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard"
import { LoginDto, RegisterDto, RefreshTokenDto, MfaSetupDto, MfaVerifyDto, LogoutDto } from "./dto/auth.dto"

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({
    status: 201,
    description: "User successfully registered",
    schema: {
      example: {
        user: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          email: "user@demo-corp.com",
          firstName: "John",
          lastName: "Doe",
          tenantId: "123e4567-e89b-12d3-a456-426614174001",
          mfaEnabled: false
        },
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        expiresIn: 86400
      }
    }
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 409, description: "User already exists" })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto)
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  @ApiResponse({
    status: 200,
    description: "User successfully logged in",
    schema: {
      example: {
        user: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          email: "user@demo-corp.com",
          firstName: "John",
          lastName: "Doe",
          tenantId: "123e4567-e89b-12d3-a456-426614174001",
          mfaEnabled: false
        },
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        expiresIn: 86400
      }
    }
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({
    status: 200,
    description: "Token successfully refreshed"
  })
  @ApiResponse({ status: 401, description: "Invalid refresh token" })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto)
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout user" })
  @ApiResponse({
    status: 200,
    description: "User successfully logged out",
    schema: {
      example: {
        success: true
      }
    }
  })
  async logout(@CurrentUser("id") userId: string, @Body() logoutDto: LogoutDto) {
    return this.authService.logout(userId, logoutDto.refreshToken)
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @Get("profile")
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({
    status: 200,
    description: "User profile retrieved successfully",
    schema: {
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "user@demo-corp.com",
        firstName: "John",
        lastName: "Doe",
        tenantId: "123e4567-e89b-12d3-a456-426614174001",
        mfaEnabled: false
      }
    }
  })
  async getProfile(@CurrentUser() user: any) {
    return user
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @Post("mfa/setup")
  @ApiOperation({ summary: "Setup MFA for current user" })
  @ApiResponse({
    status: 201,
    description: "MFA setup initiated",
    schema: {
      example: {
        qrCode: "data:image/png;base64,iVBORw0KGgoAAAANS...",
        secret: "JBSWY3DPEHPK3PXP",
        backupCodes: ["ABC123", "DEF456", "..."]
      }
    }
  })
  async setupMfa(@CurrentUser("id") userId: string, @Body() setupDto: MfaSetupDto) {
    return this.authService.setupMfa(userId, setupDto)
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @Post("mfa/verify")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify and enable MFA" })
  @ApiResponse({
    status: 200,
    description: "MFA successfully enabled",
    schema: {
      example: {
        success: true
      }
    }
  })
  @ApiResponse({ status: 400, description: "Invalid MFA code" })
  async verifyMfa(@CurrentUser("id") userId: string, @Body() verifyDto: MfaVerifyDto) {
    return this.authService.verifyMfa(userId, verifyDto)
  }
}
