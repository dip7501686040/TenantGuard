import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { PrismaService } from "../prisma/prisma.service"
import { ROLES_KEY } from "../decorators/roles.decorator"
import { IS_PUBLIC_KEY } from "../decorators/public.decorator"
import { AuthenticatedRequest } from "./jwt-auth.guard"

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])

    if (isPublic) {
      return true
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [context.getHandler(), context.getClass()])

    if (!requiredRoles) {
      return true
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const user = request.user

    if (!user) {
      return false
    }

    // Get user's roles
    const userRoles = await this.prisma.roleAssignment.findMany({
      where: {
        userId: user.id,
        role: {
          tenantId: user.tenantId
        }
      },
      include: {
        role: {
          select: {
            name: true,
            permissions: true
          }
        }
      }
    })

    const userRoleNames = userRoles.map((assignment) => assignment.role.name)
    const hasRequiredRole = requiredRoles.some((role) => userRoleNames.includes(role))

    if (!hasRequiredRole) {
      throw new ForbiddenException("Insufficient permissions")
    }

    return true
  }
}
