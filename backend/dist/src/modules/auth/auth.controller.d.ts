import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto, RefreshTokenDto, MfaSetupDto, MfaVerifyDto, LogoutDto } from "./dto/auth.dto";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<import("./auth.service").AuthResponse>;
    login(loginDto: LoginDto): Promise<import("./auth.service").AuthResponse>;
    refreshToken(refreshTokenDto: RefreshTokenDto): Promise<import("./auth.service").AuthResponse>;
    logout(userId: string, logoutDto: LogoutDto): Promise<{
        success: boolean;
    }>;
    getProfile(user: any): Promise<any>;
    setupMfa(userId: string, setupDto: MfaSetupDto): Promise<{
        qrCode: string;
        secret: string;
        backupCodes: string[];
    }>;
    verifyMfa(userId: string, verifyDto: MfaVerifyDto): Promise<{
        success: boolean;
    }>;
}
