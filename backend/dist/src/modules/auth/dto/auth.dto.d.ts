export declare class LoginDto {
    email: string;
    password: string;
    tenantSlug: string;
    mfaCode?: string;
}
export declare class RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    tenantSlug: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class MfaSetupDto {
    description?: string;
}
export declare class MfaVerifyDto {
    code: string;
}
export declare class ForgotPasswordDto {
    email: string;
    tenantSlug: string;
}
export declare class ResetPasswordDto {
    token: string;
    newPassword: string;
}
export declare class LogoutDto {
    refreshToken: string;
}
