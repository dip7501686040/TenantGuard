import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";
import { LoginDto, RegisterDto, MfaSetupDto, MfaVerifyDto, RefreshTokenDto } from "./dto/auth.dto";
export interface JwtPayload {
    sub: string;
    email: string;
    tenantId: string;
    iat?: number;
    exp?: number;
}
export interface AuthResponse {
    user: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        tenantId: string;
        mfaEnabled: boolean;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private redisService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, redisService: RedisService);
    register(registerDto: RegisterDto): Promise<AuthResponse>;
    login(loginDto: LoginDto): Promise<AuthResponse>;
    refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse>;
    setupMfa(userId: string, setupDto: MfaSetupDto): Promise<{
        qrCode: string;
        secret: string;
        backupCodes: string[];
    }>;
    verifyMfa(userId: string, verifyDto: MfaVerifyDto): Promise<{
        success: boolean;
    }>;
    logout(userId: string, refreshToken: string): Promise<{
        success: boolean;
    }>;
    private generateTokens;
    private createSession;
    private logAuditEvent;
}
