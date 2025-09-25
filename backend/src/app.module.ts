import { Module, MiddlewareConsumer } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"

// Core modules
import { PrismaModule } from "./common/prisma/prisma.module"
import { RedisModule } from "./common/redis/redis.module"

// Feature modules
import { AuthModule } from "./modules/auth/auth.module"
import { TenantsModule } from "./modules/tenants/tenants.module"
import { OrganizationsModule } from "./modules/organizations/organizations.module"
import { UsersModule } from "./modules/users/users.module"
import { RolesModule } from "./modules/roles/roles.module"
import { IdentityProvidersModule } from "./modules/identity-providers/identity-providers.module"
import { AuditModule } from "./modules/audit/audit.module"

// Common
import { TenantMiddleware } from "./common/middleware/tenant.middleware"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    TenantsModule,
    OrganizationsModule,
    UsersModule,
    RolesModule,
    IdentityProvidersModule,
    AuditModule
  ],
  providers: []
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes("*")
  }
}
