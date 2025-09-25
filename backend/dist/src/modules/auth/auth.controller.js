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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const user_decorator_1 = require("../../common/decorators/user.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const auth_dto_1 = require("./dto/auth.dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async register(registerDto) {
        return this.authService.register(registerDto);
    }
    async login(loginDto) {
        return this.authService.login(loginDto);
    }
    async refreshToken(refreshTokenDto) {
        return this.authService.refreshToken(refreshTokenDto);
    }
    async logout(userId, logoutDto) {
        return this.authService.logout(userId, logoutDto.refreshToken);
    }
    async getProfile(user) {
        return user;
    }
    async setupMfa(userId, setupDto) {
        return this.authService.setupMfa(userId, setupDto);
    }
    async verifyMfa(userId, verifyDto) {
        return this.authService.verifyMfa(userId, verifyDto);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)("register"),
    (0, swagger_1.ApiOperation)({ summary: "Register a new user" }),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Bad request" }),
    (0, swagger_1.ApiResponse)({ status: 409, description: "User already exists" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)("login"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Login with email and password" }),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Invalid credentials" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)("refresh"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Refresh access token" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Token successfully refreshed"
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Invalid refresh token" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)("JWT-auth"),
    (0, common_1.Post)("logout"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Logout user" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "User successfully logged out",
        schema: {
            example: {
                success: true
            }
        }
    }),
    __param(0, (0, user_decorator_1.CurrentUser)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_dto_1.LogoutDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)("JWT-auth"),
    (0, common_1.Get)("profile"),
    (0, swagger_1.ApiOperation)({ summary: "Get current user profile" }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)("JWT-auth"),
    (0, common_1.Post)("mfa/setup"),
    (0, swagger_1.ApiOperation)({ summary: "Setup MFA for current user" }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: "MFA setup initiated",
        schema: {
            example: {
                qrCode: "data:image/png;base64,iVBORw0KGgoAAAANS...",
                secret: "JBSWY3DPEHPK3PXP",
                backupCodes: ["ABC123", "DEF456", "..."]
            }
        }
    }),
    __param(0, (0, user_decorator_1.CurrentUser)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_dto_1.MfaSetupDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "setupMfa", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)("JWT-auth"),
    (0, common_1.Post)("mfa/verify"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Verify and enable MFA" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "MFA successfully enabled",
        schema: {
            example: {
                success: true
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid MFA code" }),
    __param(0, (0, user_decorator_1.CurrentUser)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_dto_1.MfaVerifyDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyMfa", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)("Authentication"),
    (0, common_1.Controller)("auth"),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map