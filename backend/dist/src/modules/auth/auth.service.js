"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const redis_service_1 = require("../../common/redis/redis.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService, configService, redisService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.redisService = redisService;
    }
    async register(registerDto) {
        const { email, password, firstName, lastName, tenantSlug } = registerDto;
        const tenant = await this.prisma.tenant.findUnique({
            where: { slug: tenantSlug }
        });
        if (!tenant) {
            throw new common_1.BadRequestException("Invalid tenant");
        }
        if (tenant.status !== "ACTIVE") {
            throw new common_1.BadRequestException("Tenant is not active");
        }
        const settings = tenant.settings;
        if (!settings?.allowSelfSignup) {
            throw new common_1.BadRequestException("Self-signup is not allowed for this tenant");
        }
        const existingUser = await this.prisma.user.findUnique({
            where: {
                tenantId_email: {
                    tenantId: tenant.id,
                    email
                }
            }
        });
        if (existingUser) {
            throw new common_1.ConflictException("User already exists");
        }
        const saltRounds = parseInt(this.configService.get("BCRYPT_ROUNDS") || "12", 10);
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const user = await this.prisma.user.create({
            data: {
                tenantId: tenant.id,
                email,
                passwordHash,
                firstName,
                lastName,
                isEmailVerified: false,
                status: "ACTIVE"
            }
        });
        const tokens = await this.generateTokens(user);
        await this.createSession(user.id, tenant.id, tokens.refreshToken);
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
        };
    }
    async login(loginDto) {
        const { email, password, tenantSlug, mfaCode } = loginDto;
        const tenant = await this.prisma.tenant.findUnique({
            where: { slug: tenantSlug }
        });
        if (!tenant || tenant.status !== "ACTIVE") {
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        const user = await this.prisma.user.findUnique({
            where: {
                tenantId_email: {
                    tenantId: tenant.id,
                    email
                }
            }
        });
        if (!user || user.status !== "ACTIVE") {
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        if (user.mfaEnabled) {
            if (!mfaCode) {
                throw new common_1.BadRequestException("MFA code required");
            }
            const isMfaValid = speakeasy.totp.verify({
                secret: user.mfaSecret,
                encoding: "base32",
                token: mfaCode,
                window: 2
            });
            if (!isMfaValid) {
                throw new common_1.UnauthorizedException("Invalid MFA code");
            }
        }
        const tokens = await this.generateTokens(user);
        await this.createSession(user.id, tenant.id, tokens.refreshToken);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                lastLoginAt: new Date(),
                loginCount: {
                    increment: 1
                }
            }
        });
        await this.logAuditEvent(tenant.id, user.id, "user_login", `user:${user.id}`, { loginMethod: "native" }, true);
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
        };
    }
    async refreshToken(refreshTokenDto) {
        const { refreshToken } = refreshTokenDto;
        let payload;
        try {
            payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get("JWT_SECRET")
            });
        }
        catch (error) {
            throw new common_1.UnauthorizedException("Invalid refresh token");
        }
        const session = await this.prisma.session.findUnique({
            where: { refreshToken },
            include: { user: true }
        });
        if (!session || !session.isActive || session.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException("Session expired or invalid");
        }
        const tokens = await this.generateTokens(session.user);
        await this.prisma.session.update({
            where: { id: session.id },
            data: {
                refreshToken: tokens.refreshToken,
                accessToken: tokens.accessToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
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
        };
    }
    async setupMfa(userId, setupDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { tenant: true }
        });
        if (!user) {
            throw new common_1.BadRequestException("User not found");
        }
        if (user.mfaEnabled) {
            throw new common_1.BadRequestException("MFA is already enabled");
        }
        const secret = speakeasy.generateSecret({
            name: `${user.email} (${user.tenant.name})`,
            issuer: this.configService.get("MFA_ISSUER") || "TenantGuard"
        });
        const qrCode = await qrcode.toDataURL(secret.otpauth_url);
        const backupCodes = Array.from({ length: 10 }, () => Math.random().toString(36).substring(2, 8).toUpperCase());
        const tempData = {
            secret: secret.base32,
            backupCodes,
            timestamp: Date.now()
        };
        try {
            await this.redisService.set(`mfa_setup:${userId}`, JSON.stringify(tempData), 600);
        }
        catch (redisError) {
            console.warn("Redis unavailable, falling back to database storage:", redisError.message);
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    tempMfaSetup: JSON.stringify({
                        ...tempData,
                        expiresAt: expiresAt.toISOString()
                    })
                }
            });
        }
        return {
            qrCode,
            secret: secret.base32,
            backupCodes
        };
    }
    async verifyMfa(userId, verifyDto) {
        const { code } = verifyDto;
        let tempData = null;
        try {
            const tempDataStr = await this.redisService.get(`mfa_setup:${userId}`);
            if (tempDataStr) {
                tempData = JSON.parse(tempDataStr);
            }
        }
        catch (redisError) {
            console.warn("Redis unavailable, checking database fallback:", redisError.message);
        }
        if (!tempData) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { tempMfaSetup: true }
            });
            if (!user?.tempMfaSetup) {
                throw new common_1.BadRequestException("MFA setup session expired");
            }
            const tempMfaData = JSON.parse(user.tempMfaSetup);
            if (tempMfaData.expiresAt && new Date() > new Date(tempMfaData.expiresAt)) {
                await this.prisma.user.update({
                    where: { id: userId },
                    data: { tempMfaSetup: null }
                });
                throw new common_1.BadRequestException("MFA setup session expired");
            }
            tempData = tempMfaData;
        }
        const verified = speakeasy.totp.verify({
            secret: tempData.secret,
            encoding: "base32",
            token: code,
            window: 2
        });
        if (!verified) {
            throw new common_1.BadRequestException("Invalid MFA code");
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                mfaEnabled: true,
                mfaSecret: tempData.secret,
                backupCodes: tempData.backupCodes,
                tempMfaSetup: null
            }
        });
        try {
            await this.redisService.del(`mfa_setup:${userId}`);
        }
        catch (redisError) {
            console.warn("Redis unavailable for cleanup, but database fallback was already cleared:", redisError.message);
        }
        return { success: true };
    }
    async logout(userId, refreshToken) {
        await this.prisma.session.updateMany({
            where: {
                userId,
                refreshToken
            },
            data: {
                isActive: false
            }
        });
        return { success: true };
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId
        };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get("JWT_SECRET"),
                expiresIn: this.configService.get("JWT_EXPIRES_IN") || "24h"
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get("JWT_SECRET"),
                expiresIn: this.configService.get("REFRESH_TOKEN_EXPIRES_IN") || "7d"
            })
        ]);
        return { accessToken, refreshToken };
    }
    async createSession(userId, tenantId, refreshToken) {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.prisma.session.create({
            data: {
                userId,
                tenantId,
                refreshToken,
                expiresAt,
                isActive: true
            }
        });
    }
    async logAuditEvent(tenantId, userId, action, resource, details, success) {
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
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, jwt_1.JwtService, config_1.ConfigService, redis_service_1.RedisService])
], AuthService);
//# sourceMappingURL=auth.service.js.map