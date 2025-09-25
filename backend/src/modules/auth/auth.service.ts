import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { ConfigService } from "@nestjs/config"
import * as bcrypt from "bcryptjs"
import * as speakeasy from "speakeasy"
import * as qrcode from "qrcode"
import { PrismaService } from "../../common/prisma/prisma.service"
import { RedisService } from "../../common/redis/redis.service"
import { LoginDto, RegisterDto, MfaSetupDto, MfaVerifyDto, RefreshTokenDto } from "./dto/auth.dto"

export interface JwtPayload {
  sub: string
  email: string
  tenantId: string
  iat?: number
  exp?: number
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    tenantId: string
    mfaEnabled: boolean
  }
  accessToken: string
  refreshToken: string
  expiresIn: number
}

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService, private configService: ConfigService, private redisService: RedisService) {}

  /**
   * Register a new user (for tenants that allow self-signup)
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, firstName, lastName, tenantSlug } = registerDto

    // Find tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    })

    if (!tenant) {
      throw new BadRequestException("Invalid tenant")
    }

    if (tenant.status !== "ACTIVE") {
      throw new BadRequestException("Tenant is not active")
    }

    // Check if tenant allows self-signup
    const settings = tenant.settings as any
    if (!settings?.allowSelfSignup) {
      throw new BadRequestException("Self-signup is not allowed for this tenant")
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email
        }
      }
    })

    if (existingUser) {
      throw new ConflictException("User already exists")
    }

    // Hash password
    const saltRounds = parseInt(this.configService.get<string>("BCRYPT_ROUNDS") || "12", 10)
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user
    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        passwordHash,
        firstName,
        lastName,
        isEmailVerified: false, // TODO: Implement email verification
        status: "ACTIVE"
      }
    })

    // Generate tokens
    const tokens = await this.generateTokens(user)

    // Create session
    await this.createSession(user.id, tenant.id, tokens.refreshToken)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId,
        mfaEnabled: user.mfaEnabled
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 24 * 60 * 60 // 24 hours
    }
  }

  /**
   * Login with username/password
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password, tenantSlug, mfaCode } = loginDto

    // Find tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    })

    if (!tenant || tenant.status !== "ACTIVE") {
      throw new UnauthorizedException("Invalid credentials")
    }

    // Find user
    const user = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email
        }
      }
    })

    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedException("Invalid credentials")
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials")
    }

    // Check MFA if enabled
    if (user.mfaEnabled) {
      if (!mfaCode) {
        throw new BadRequestException("MFA code required")
      }

      const isMfaValid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: "base32",
        token: mfaCode,
        window: 2
      })

      if (!isMfaValid) {
        throw new UnauthorizedException("Invalid MFA code")
      }
    }

    // Generate tokens
    const tokens = await this.generateTokens(user)

    // Create session
    await this.createSession(user.id, tenant.id, tokens.refreshToken)

    // Update login stats
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: {
          increment: 1
        }
      }
    })

    // Log audit event
    await this.logAuditEvent(tenant.id, user.id, "user_login", `user:${user.id}`, { loginMethod: "native" }, true)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId,
        mfaEnabled: user.mfaEnabled
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 24 * 60 * 60
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    const { refreshToken } = refreshTokenDto

    // Verify refresh token
    let payload: JwtPayload
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("JWT_SECRET")
      })
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token")
    }

    // Check if session exists
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true }
    })

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      throw new UnauthorizedException("Session expired or invalid")
    }

    // Generate new tokens
    const tokens = await this.generateTokens(session.user)

    // Update session with new refresh token
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: tokens.refreshToken,
        accessToken: tokens.accessToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    })

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        tenantId: session.user.tenantId,
        mfaEnabled: session.user.mfaEnabled
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 24 * 60 * 60
    }
  }

  /**
   * Setup MFA for a user
   */
  async setupMfa(userId: string, setupDto: MfaSetupDto): Promise<{ qrCode: string; secret: string; backupCodes: string[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true }
    })

    if (!user) {
      throw new BadRequestException("User not found")
    }

    if (user.mfaEnabled) {
      throw new BadRequestException("MFA is already enabled")
    }

    // Generate MFA secret
    const secret = speakeasy.generateSecret({
      name: `${user.email} (${user.tenant.name})`,
      issuer: this.configService.get<string>("MFA_ISSUER") || "TenantGuard"
    })

    // Generate QR code
    const qrCode = await qrcode.toDataURL(secret.otpauth_url)

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => Math.random().toString(36).substring(2, 8).toUpperCase())

    // Store temporary MFA setup data with fallback to database
    const tempData = {
      secret: secret.base32,
      backupCodes,
      timestamp: Date.now()
    }

    try {
      // Try Redis first
      await this.redisService.set(
        `mfa_setup:${userId}`,
        JSON.stringify(tempData),
        600 // 10 minutes
      )
    } catch (redisError) {
      console.warn("Redis unavailable, falling back to database storage:", redisError.message)

      // Fallback: Store in user record with expiration
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          tempMfaSetup: JSON.stringify({
            ...tempData,
            expiresAt: expiresAt.toISOString()
          })
        }
      })
    }

    return {
      qrCode,
      secret: secret.base32,
      backupCodes
    }
  }

  /**
   * Verify and enable MFA
   */
  async verifyMfa(userId: string, verifyDto: MfaVerifyDto): Promise<{ success: boolean }> {
    const { code } = verifyDto

    let tempData: any = null

    try {
      // Try to get temporary MFA setup data from Redis first
      const tempDataStr = await this.redisService.get(`mfa_setup:${userId}`)
      if (tempDataStr) {
        tempData = JSON.parse(tempDataStr)
      }
    } catch (redisError) {
      console.warn("Redis unavailable, checking database fallback:", redisError.message)
    }

    // Fallback to database if Redis failed or no data found
    if (!tempData) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { tempMfaSetup: true }
      })

      if (!user?.tempMfaSetup) {
        throw new BadRequestException("MFA setup session expired")
      }

      const tempMfaData = JSON.parse(user.tempMfaSetup)

      // Check if the data has expired (10 minutes)
      if (tempMfaData.expiresAt && new Date() > new Date(tempMfaData.expiresAt)) {
        // Clean up expired data
        await this.prisma.user.update({
          where: { id: userId },
          data: { tempMfaSetup: null }
        })
        throw new BadRequestException("MFA setup session expired")
      }

      tempData = tempMfaData
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: tempData.secret,
      encoding: "base32",
      token: code,
      window: 2
    })

    if (!verified) {
      throw new BadRequestException("Invalid MFA code")
    }

    // Enable MFA for user
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaSecret: tempData.secret,
        backupCodes: tempData.backupCodes,
        tempMfaSetup: null // Clear the temporary setup data
      }
    })

    // Clean up temporary data from Redis (if available)
    try {
      await this.redisService.del(`mfa_setup:${userId}`)
    } catch (redisError) {
      console.warn("Redis unavailable for cleanup, but database fallback was already cleared:", redisError.message)
    }

    return { success: true }
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshToken: string): Promise<{ success: boolean }> {
    // Deactivate session
    await this.prisma.session.updateMany({
      where: {
        userId,
        refreshToken
      },
      data: {
        isActive: false
      }
    })

    return { success: true }
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("JWT_SECRET"),
        expiresIn: this.configService.get<string>("JWT_EXPIRES_IN") || "24h"
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("JWT_SECRET"),
        expiresIn: this.configService.get<string>("REFRESH_TOKEN_EXPIRES_IN") || "7d"
      })
    ])

    return { accessToken, refreshToken }
  }

  /**
   * Create user session
   */
  private async createSession(userId: string, tenantId: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await this.prisma.session.create({
      data: {
        userId,
        tenantId,
        refreshToken,
        expiresAt,
        isActive: true
      }
    })
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(tenantId: string, userId: string, action: string, resource: string, details: any, success: boolean): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action,
        resource,
        details,
        success,
        timestamp: new Date()
      }
    })
  }
}
