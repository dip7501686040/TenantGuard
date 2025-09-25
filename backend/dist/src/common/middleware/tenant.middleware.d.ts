import { NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { PrismaService } from "../prisma/prisma.service";
export interface TenantRequest extends Request {
    tenant?: {
        id: string;
        slug: string;
        name: string;
        status: string;
    };
}
export declare class TenantMiddleware implements NestMiddleware {
    private prisma;
    constructor(prisma: PrismaService);
    use(req: TenantRequest, res: Response, next: NextFunction): Promise<void>;
}
