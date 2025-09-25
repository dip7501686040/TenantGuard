import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        tenantId: string;
        roles?: string[];
    };
    tenant?: {
        id: string;
        slug: string;
        name: string;
        status: string;
    };
}
export declare class JwtAuthGuard implements CanActivate {
    private jwtService;
    private reflector;
    private prisma;
    constructor(jwtService: JwtService, reflector: Reflector, prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractTokenFromHeader;
}
