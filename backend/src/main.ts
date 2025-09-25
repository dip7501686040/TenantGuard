import { NestFactory } from "@nestjs/core"
import { ValidationPipe, Logger } from "@nestjs/common"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { AppModule } from "./app.module"
import { PrismaExceptionFilter } from "./common/filters/prisma-exception.filter"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const logger = new Logger("Bootstrap")

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    })
  )

  // Global filters
  app.useGlobalFilters(new PrismaExceptionFilter())

  // CORS configuration
  app.enableCors({
    origin: process.env.WEB_BASE_URL || "http://localhost:3000",
    credentials: true
  })

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("TenantGuard API")
    .setDescription("Multi-tenant IAM system API documentation")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header"
      },
      "JWT-auth"
    )
    .addTag("Authentication", "Authentication and authorization endpoints")
    .addTag("Tenants", "Tenant management endpoints")
    .addTag("Organizations", "Organization management endpoints")
    .addTag("Users", "User management endpoints")
    .addTag("Roles", "Role and permission management endpoints")
    .addTag("Identity Providers", "IdP configuration endpoints")
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true
    }
  })

  const port = process.env.PORT || 3001
  await app.listen(port)

  logger.log(`🚀 Application is running on: http://localhost:${port}`)
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`)
}

bootstrap()
