import { Injectable, NestMiddleware } from "@nestjs/common"
import { Request, Response, NextFunction } from "express"
import { PrismaService } from "../prisma/prisma.service"

export interface TenantRequest extends Request {
  tenant?: {
    id: string
    slug: string
    name: string
    status: string
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: TenantRequest, res: Response, next: NextFunction) {
    try {
      // Extract tenant identifier from various sources
      let tenantSlug: string | undefined

      // 1. From subdomain (tenant-slug.domain.com)
      const host = req.get("host")
      if (host) {
        const subdomain = host.split(".")[0]
        if (subdomain && subdomain !== "api" && subdomain !== "www") {
          tenantSlug = subdomain
        }
      }

      // 2. From header (for API clients)
      if (!tenantSlug) {
        tenantSlug = req.get("x-tenant-slug") as string
      }

      // 3. From path parameter (for multi-tenant API routing)
      if (!tenantSlug && req.params.tenantSlug) {
        tenantSlug = req.params.tenantSlug
      }

      // 4. From query parameter (fallback)
      if (!tenantSlug && req.query.tenant) {
        tenantSlug = req.query.tenant as string
      }

      if (tenantSlug) {
        // Fetch tenant information
        const tenant = await this.prisma.tenant.findUnique({
          where: { slug: tenantSlug },
          select: {
            id: true,
            slug: true,
            name: true,
            status: true
          }
        })

        if (tenant && tenant.status === "ACTIVE") {
          req.tenant = tenant
        }
      }

      next()
    } catch (error) {
      // Log error but don't block request
      console.error("Tenant middleware error:", error)
      next()
    }
  }
}
