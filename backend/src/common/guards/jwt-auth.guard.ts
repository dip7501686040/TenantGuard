import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { Request } from "express"
import { PrismaService } from "../prisma/prisma.service"
import { IS_PUBLIC_KEY } from "../decorators/public.decorator"

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    tenantId: string
    roles?: string[]
  }
  tenant?: {
    id: string
    slug: string
    name: string
    status: string
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])

    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException("Access token required")
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET
      })

      // Verify user exists and is active
      const user = await this.prisma.user.findFirst({
        where: {
          id: payload.sub,
          status: "ACTIVE"
        },
        select: {
          id: true,
          email: true,
          tenantId: true,
          status: true
        }
      })

      if (!user) {
        throw new UnauthorizedException("User not found or inactive")
      }

      // Check tenant context if required
      if (request.tenant && user.tenantId !== request.tenant.id) {
        throw new UnauthorizedException("User does not belong to this tenant")
      }

      request.user = {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId
      }

      return true
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired token")
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? []
    return type === "Bearer" ? token : undefined
  }
}
