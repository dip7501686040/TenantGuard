import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsString, IsOptional, MinLength, IsNotEmpty } from "class-validator"

export class LoginDto {
  @ApiProperty({
    example: "user@demo-corp.com",
    description: "User email address"
  })
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty({
    example: "UserPassword123!",
    description: "User password"
  })
  @IsString()
  @MinLength(6)
  password: string

  @ApiProperty({
    example: "demo-corp",
    description: "Tenant slug"
  })
  @IsString()
  @IsNotEmpty()
  tenantSlug: string

  @ApiProperty({
    example: "123456",
    description: "MFA code (if MFA is enabled)",
    required: false
  })
  @IsOptional()
  @IsString()
  mfaCode?: string
}

export class RegisterDto {
  @ApiProperty({
    example: "user@demo-corp.com",
    description: "User email address"
  })
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty({
    example: "UserPassword123!",
    description: "User password"
  })
  @IsString()
  @MinLength(6)
  password: string

  @ApiProperty({
    example: "John",
    description: "User first name"
  })
  @IsString()
  @IsNotEmpty()
  firstName: string

  @ApiProperty({
    example: "Doe",
    description: "User last name"
  })
  @IsString()
  @IsNotEmpty()
  lastName: string

  @ApiProperty({
    example: "demo-corp",
    description: "Tenant slug"
  })
  @IsString()
  @IsNotEmpty()
  tenantSlug: string
}

export class RefreshTokenDto {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "Refresh token"
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string
}

export class MfaSetupDto {
  @ApiProperty({
    example: "Setup MFA for enhanced security",
    description: "Optional description for MFA setup",
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string
}

export class MfaVerifyDto {
  @ApiProperty({
    example: "123456",
    description: "6-digit MFA code from authenticator app"
  })
  @IsString()
  @MinLength(6)
  code: string
}

export class ForgotPasswordDto {
  @ApiProperty({
    example: "user@demo-corp.com",
    description: "User email address"
  })
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty({
    example: "demo-corp",
    description: "Tenant slug"
  })
  @IsString()
  @IsNotEmpty()
  tenantSlug: string
}

export class ResetPasswordDto {
  @ApiProperty({
    example: "reset-token-here",
    description: "Password reset token"
  })
  @IsString()
  @IsNotEmpty()
  token: string

  @ApiProperty({
    example: "NewPassword123!",
    description: "New password"
  })
  @IsString()
  @MinLength(6)
  newPassword: string
}

export class LogoutDto {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "Refresh token to invalidate"
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string
}
